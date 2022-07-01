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

@TpService({ inject_root: true })
export class RabbitDefine<Exchange extends string = DefaultRabbitmqExchange, Queue extends string = never> {

    public readonly exchanges: Parameters<Channel['assertExchange']>[] = []
    public readonly queues: Parameters<Channel['assertQueue']>[] = []
    public readonly exchange_bindings: Parameters<Channel['bindExchange']>[] = []
    public readonly queue_bindings: Parameters<Channel['bindQueue']>[] = []
    private exchange_key_set = new Set<string>()
    private queue_key_set = new Set<string>()
    private exchange_binding_key_set = new Set<string>()
    private queue_binding_key_set = new Set<string>()

    define_exchange<T extends string>(exchange: T extends Exchange ? never : T, type: 'topic' | 'direct' | 'fanout' | string, options?: ExchangeOptions): RabbitDefine<Exchange | T, Queue> {
        if (!this.exchange_key_set.has(exchange)) {
            this.exchange_key_set.add(exchange)
            this.exchanges.push([exchange, type, options])
        }
        return this
    }

    define_queue<T extends string>(queue: T extends Queue ? never : T, options?: QueueOptions): RabbitDefine<Exchange, Queue | T> {
        if (!this.queue_key_set.has(queue)) {
            this.queue_key_set.add(queue)
            this.queues.push([queue, options])
        }
        return this
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
}
