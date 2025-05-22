/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '@tarpit/core'
import { Channel } from 'amqplib'

export type DefaultRabbitmqExchange = 'amq.direct' | 'amq.topic' | 'amq.headers' | 'amq.fanout'

export interface ExchangeOptions {
    durable?: boolean
    internal?: boolean
    autoDelete?: boolean
    alternateExchange?: string
    arguments?: any
}

export interface QueueOptions {
    exclusive?: boolean
    durable?: boolean
    autoDelete?: boolean
    messageTtl?: number
    expires?: number
    deadLetterExchange?: string
    deadLetterRoutingKey?: string
    maxLength?: number
    maxPriority?: number
    arguments?: any
}

export const RabbitDefineToken = Symbol.for('œœ.token.rabbitmq.definition')

@TpService({ inject_root: true })
export class RabbitDefine<Exchange extends string = DefaultRabbitmqExchange, Queue extends string = never> {

    public readonly exchange_defines: Parameters<Channel['assertExchange']>[] = []
    public readonly queue_defines: Parameters<Channel['assertQueue']>[] = []
    public readonly exchange_bindings: Parameters<Channel['bindExchange']>[] = []
    public readonly queue_bindings: Parameters<Channel['bindQueue']>[] = []
    private exchange_key_set: { [p: string]: string } = {
        'amq.direct': 'amq.direct',
        'amq.topic': 'amq.topic',
        'amq.fanout': 'amq.fanout',
        'amq.headers': 'amq.headers',
    }
    private queue_key_set: { [p: string]: string } = {}
    private exchange_binding_key_set = new Set<string>()
    private queue_binding_key_set = new Set<string>()

    get X() {
        return this.exchange
    }

    get exchange(): Readonly<{ [X in Exchange]: X }> {
        return this.exchange_key_set as any
    }

    get Q() {
        return this.queue
    }

    get queue(): Readonly<{ [Q in Queue]: Q }> {
        return this.queue_key_set as any
    }

    bind_exchange(source: Exchange, destination: Exchange, routing_key: string, args?: any): RabbitDefine<Exchange, Queue> {
        const key = source + destination + routing_key
        if (!this.exchange_binding_key_set.has(key)) {
            this.exchange_binding_key_set.add(key)
            this.exchange_bindings.push([destination, source, routing_key, args])
        }
        return this
    }

    bind_queue(source: Exchange, queue: Queue, routing_key: string, args?: any): RabbitDefine<Exchange, Queue> {
        const key = source + queue + routing_key
        if (!this.queue_binding_key_set.has(key)) {
            this.queue_binding_key_set.add(key)
            this.queue_bindings.push([queue, source, routing_key, args])
        }
        return this
    }

    define_exchange<T extends string>(exchange: T extends Exchange ? never : T, type: 'topic' | 'direct' | 'fanout' | string, options?: ExchangeOptions): RabbitDefine<Exchange | T, Queue> {
        if (!this.exchange_key_set[exchange]) {
            this.exchange_key_set[exchange] = exchange
            this.exchange_defines.push([exchange, type, options])
        }
        return this as any
    }

    define_queue<T extends string>(queue: T extends Queue ? never : T, options?: QueueOptions): RabbitDefine<Exchange, Queue | T> {
        if (!this.queue_key_set[queue]) {
            this.queue_key_set[queue] = queue
            this.queue_defines.push([queue, options])
        }
        return this as any
    }

    merge(defines: RabbitDefine) {
        defines.exchange_defines.forEach(ex => this.define_exchange(...(ex as [any, any, any])))
        defines.queue_defines.forEach(q => this.define_queue(...(q as [any, any])))
        defines.exchange_bindings.forEach(exb => this.bind_exchange(exb[1] as any, exb[0] as any, exb[2], exb[3]))
        defines.queue_bindings.forEach(qb => this.bind_queue(qb[1] as any, qb[0] as any, qb[2], qb[3]))
        return this
    }
}
