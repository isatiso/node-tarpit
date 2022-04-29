/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PureJSONObject } from '../__types__'

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

export type Producer<T> = (message: Record<keyof T, T[keyof T]> extends PureJSONObject ? T : never, options?: ProduceOptions) => Promise<void>
