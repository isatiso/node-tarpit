/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Deque, ImportsAndProviders, PureJSON, TpAssemblyCommon, TpUnitCommon, TpWorkerCommon } from '@tarpit/core'
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

export interface TpProducerMeta extends TpWorkerCommon<'TpProducer'> {
    producer_options?: TpProducerOptions
}

export interface TpConsumerMeta extends TpAssemblyCommon<'TpConsumer'> {
    consumer_options?: TpConsumerOptions
}

export interface TpConsumerUnit<T extends (...args: any) => any> extends TpUnitCommon<T> {
    u_type: 'TpConsumerUnit'
    ur_consumer_tag?: string
    ur_consume?: { queue: string, options: ConsumeOptions }
    ur_channel_wrapper?: ChannelWrapper
    ur_channel_error?: any
}

export interface TpProducerUnit<T extends (...args: any) => any> extends TpUnitCommon<T> {
    u_type: 'TpProducerUnit'
    ur_produce?: { exchange: string, routing_key: string, options: ProduceOptions }
    ur_produce_cache: Deque<[message: any, produce_options: ProduceOptions | undefined, resolve: (data: any) => void, reject: (err: any) => void]>
    ur_channel_wrapper?: ChannelWrapper
    ur_channel_error?: any
}
