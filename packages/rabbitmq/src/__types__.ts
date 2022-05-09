/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BasePropertyFunction, BaseTpModuleMeta, BaseTpServiceMeta, Deque, ImportsAndProviders, Injector, PureJSON } from '@tarpit/core'
import { ChannelWrapper } from './channel-wrapper'

export interface ExchangeAssertion {
    type: 'exchange'
    exchange: string
    exchange_type: 'direct' | 'topic' | 'headers' | 'fanout' | 'match' | string
    options?: ExchangeAssertionOptions
}

export interface ExchangeAssertionOptions {
    durable?: boolean
    internal?: boolean
    autoDelete?: boolean
    alternateExchange?: string
    arguments?: any
}

export interface QueueAssertion {
    type: 'queue'
    queue: string
    options?: QueueAssertionOptions
}

export interface QueueAssertionOptions {
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

export interface ExchangeBinding {
    type: 'exchange_to_exchange'
    destination: string
    source: string
    routing_key: string
}

export interface QueueBinding {
    type: 'exchange_to_queue'
    exchange: string
    queue: string
    routing_key: string
}

export type Binding = ExchangeBinding | QueueBinding

export type Assertion = ExchangeAssertion | QueueAssertion

export interface ProduceOptions {
    expiration?: string | number
    userId?: string
    CC?: string | string[]

    mandatory?: boolean
    persistent?: boolean
    deliveryMode?: boolean | number
    BCC?: string | string[]

    contentType?: string
    contentEncoding?: string
    headers?: any;
    priority?: number
    correlationId?: string
    replyTo?: string
    messageId?: string
    timestamp?: number
    type?: string
    appId?: string
}

export interface ConsumeOptions {
    consumerTag?: string
    noLocal?: boolean
    noAck?: boolean
    exclusive?: boolean
    priority?: number
    arguments?: any
    prefetch?: number
}

export type Producer<T> = (message: Record<keyof T, T[keyof T]> extends PureJSON ? T : never, options?: ProduceOptions) => Promise<void>

export interface MessageProperties {
    expiration: string | undefined
    userId: string | undefined
    deliveryMode: number | undefined
    contentType: string | undefined
    contentEncoding: string | undefined
    headers: any | undefined
    priority: number | undefined
    correlationId: string | undefined
    replyTo: string | undefined
    messageId: string | undefined
    timestamp: number | undefined
    type: string | undefined
    appId: string | undefined
    clusterId: string | undefined
}

export interface MessageFields {
    consumerTag: string
    deliveryTag: number
    redelivered: boolean
    exchange: string
    routingKey: string
}

export interface MessageObject {
    content: Buffer
    fields: MessageFields
    properties: MessageProperties
}

export interface TpConsumerOptions extends ImportsAndProviders {
}

export interface TpProducerOptions {
    assertions?: Assertion[]
    bindings?: Binding[]
}

export interface TpProducerMeta extends BaseTpServiceMeta<'TpProducer'> {
    producer_options?: TpProducerOptions
    function_collector: () => ProducerFunction<any>[]
    on_load: (meta: TpProducerMeta, injector: Injector) => void
}

export interface TpConsumerMeta extends BaseTpModuleMeta<'TpConsumer'> {
    consumer_options?: TpConsumerOptions
    function_collector: () => ConsumerFunction<any>[]
    on_load: (meta: TpConsumerMeta, injector: Injector) => void
}

export interface ConsumerFunction<T extends (...args: any) => any> extends BasePropertyFunction<T> {
    type: 'TpConsumerFunction'
    consumerTag?: string
    consume?: { queue: string, options: ConsumeOptions }
    channel_wrapper?: ChannelWrapper
    channel_error?: any
}

export interface ProducerFunction<T extends (...args: any) => any> extends BasePropertyFunction<T> {
    type: 'TpProducerFunction'
    produce?: { exchange: string, routing_key: string, options: ProduceOptions }
    produce_cache: Deque<[message: any, produce_options: ProduceOptions | undefined, resolve: (data: any) => void, reject: (err: any) => void]>
    channel_wrapper?: ChannelWrapper
    channel_error?: any
}
