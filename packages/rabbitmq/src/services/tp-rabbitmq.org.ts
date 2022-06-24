/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData } from '@tarpit/config'
import { get_providers, Injector, ValueProvider } from '@tarpit/core'
import { connect as connect_rabbitmq, Connection, ConsumeMessage, Options } from 'amqplib'
import { EventEmitter } from 'events'
import { ProduceOptions, Producer } from '../__types__'
import { TpConsumer, TpConsumerToken, TpProducer, TpProducerToken } from '../annotations'
import { ConsumeUnit } from '../annotations/consume'
import { ProduceUnit } from '../annotations/produce'
import { ChannelWrapper } from '../builtin/channel-wrapper'
import { Ack, Dead, Requeue } from './error'
import { Letter, PURE_LETTER } from '../builtin/letter'
import { collect_consumes, collect_produces } from '../tools'

export class TpRabbitmqOrg {

    public connection?: Connection
    public readonly emitter = new EventEmitter()
    public readonly channel_collector = new Set<ChannelWrapper>()
    public url?: string | Options.Connect
    public prefetch?: number
    public socket_options?: any

    private readonly consumers: Array<[meta: TpConsumer, injector: Injector]> = []
    private readonly producers: Array<[meta: TpProducer, injector: Injector]> = []
    private interval_num?: NodeJS.Timeout
    private loading = false
    private destroyed = false

    constructor(
        private injector: Injector,
        private config_data: ConfigData
    ) {
        this.emitter.setMaxListeners(1000)
        ValueProvider.create(this.injector, { provide: 'œœ-TpProducer', useValue: TpRabbitmqOrg })
        const amqp = this.config_data.get('rabbitmq')
        if (amqp) {
            this.set_config(amqp.url, amqp.prefetch, amqp.socket_options)
        }
    }

    set_config(url: string | Options.Connect, prefetch?: number, socket_options?: any) {
        this.url = url
        this.prefetch = prefetch
        this.socket_options = socket_options
    }

    async terminate() {
        this.destroyed = true
        await Promise.all(
            Array.from(this.channel_collector).map(ch => ch.channel?.waitForConfirms())
        )
        await this.connection?.close()
        return
    }

    load(meta: TpProducer | TpConsumer, injector: Injector) {
        if (meta instanceof TpConsumer) {
            meta.units = collect_consumes(meta)
            this.consumers.push([meta, injector])
        } else if (meta instanceof TpProducer) {
            meta.units = collect_produces(meta)
            for (const unit of meta.units) {
                const producer: Producer<any> = (message: any, produce_options?: ProduceOptions): Promise<void> => {
                    return new Promise((resolve, reject) => {
                        unit.produce_cache.push([message, produce_options, resolve, reject])
                    })
                }
                Object.defineProperty(unit.cls.prototype, unit.prop, {
                    writable: true,
                    enumerable: true,
                    configurable: true,
                    value: producer
                })
            }
            this.producers.push([meta, injector])
        }
    }

    reconnect(url: string | Options.Connect, count: number = 0) {
        connect_rabbitmq(url, this.socket_options).then(conn => {
            this.connection = conn
            conn.on('close', () => {
                if (!this.destroyed) {
                    this.reconnect(url)
                }
            })
            this.emitter.emit('reconnected')
        }).catch(err => {
            if (count > 48) {
                console.log(err)
                process.exit(255)
            }
            setTimeout(() => this.reconnect(url, count + 1), 2500)
        })
    }

    async start() {
        if (!this.url) {
            return
        }
        const url = this.url
        connect_rabbitmq(url, this.socket_options).then(async conn => {
            this.connection = conn
            conn.on('close', () => {
                if (!this.destroyed) {
                    this.reconnect(url)
                }
            })
            if (!this.interval_num) {
                this.interval_num = setInterval(async () => {
                    if (this.loading || !this.connection) {
                        return
                    }
                    if (!this.producers.length && !this.consumers.length) {
                        return
                    }
                    this.loading = true
                    while (this.producers.length) {
                        const [meta, injector] = this.producers.pop()!
                        await this._load(conn, meta, injector)
                    }
                    while (this.consumers.length) {
                        const [meta, injector] = this.consumers.pop()!
                        await this._load(conn, meta, injector)
                    }
                    this.loading = false
                }, 100)
            }
        }).catch(err => {
            console.log(err)
            process.exit(255)
        })
    }

    private async _load(conn: Connection, meta: TpProducer | TpConsumer, injector: Injector): Promise<void> {
        const channel = await conn.createChannel()
        if (meta instanceof TpProducer) {
            for (const assertion of meta?.assertions ?? []) {
                if (assertion.type === 'exchange') {
                    await channel.assertExchange(assertion.exchange, assertion.exchange_type, assertion.options)
                } else {
                    await channel.assertQueue(assertion.queue, assertion.options)
                }
            }
            for (const binding of meta?.bindings ?? []) {
                if (binding.type === 'exchange_to_exchange') {
                    await channel.bindExchange(binding.destination, binding.source, binding.routing_key)
                } else {
                    await channel.bindQueue(binding.queue, binding.exchange, binding.routing_key)
                }
            }
            for (const unit of meta.units) {
                await this.put_producer(unit)
            }
        } else if (meta instanceof TpConsumer) {
            for (const unit of meta.units) {
                await this.put_consumer(injector, unit)
            }
        }
        await channel.close()
    }

    private async put_producer(unit: ProduceUnit) {
        const channel_wrapper = new ChannelWrapper(this)
        const producer = (message: any, options?: ProduceOptions): Promise<void> => {
            const o = options ? { ...unit.options, ...options } : unit.options
            return channel_wrapper.publish(unit.exchange, unit.routing_key, Buffer.from(JSON.stringify(message)), o)
        }
        Object.defineProperty(unit.cls.prototype, unit.prop, {
            writable: true,
            enumerable: true,
            configurable: true,
            value: producer
        })
        while (unit.produce_cache.length) {
            const [msg, options, resolve, reject] = unit.produce_cache.shift()!
            const o = options ? { ...unit.options, ...options } : unit.options
            channel_wrapper.pure_publish(unit.exchange, unit.routing_key, Buffer.from(JSON.stringify(msg)), o, resolve, reject)
        }
    }

    private async put_consumer(injector: Injector, unit: ConsumeUnit): Promise<void> {
        const channel_wrapper = new ChannelWrapper(this)
        const provider_list = get_providers(unit, injector, new Set([Letter, PURE_LETTER]))

        const on_message = async function(msg: ConsumeMessage | null): Promise<void> {
            if (!msg) {
                throw new Error('Channel closed by server.')
            }
            const param_list = provider_list.map((provider: any) => {
                if (provider === undefined) {
                    return undefined
                } else if (provider === Letter) {
                    const content = JSON.parse(msg.content.toString('utf-8'))
                    return new Letter(content, msg.fields, msg.properties)
                } else if (provider === PURE_LETTER) {
                    return msg
                } else {
                    return provider.create()
                }
            })

            try {
                await unit.handler(...param_list)
                channel_wrapper.channel?.ack(msg)
            } catch (reason) {
                if (reason instanceof Ack) {
                    channel_wrapper.channel?.ack(msg)
                } else if (reason instanceof Requeue) {
                    channel_wrapper.channel?.reject(msg)
                } else if (reason instanceof Dead) {
                    channel_wrapper.channel?.reject(msg, false)
                } else {
                    channel_wrapper.channel?.reject(msg)
                }
            }
        }

        channel_wrapper.consume(unit.queue, msg => on_message(msg).catch(e => console.log('catch', e)), unit.options)
    }
}
