/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ExchangeAssertion, ExchangeAssertionOptions, ExchangeBinding, QueueAssertion, QueueAssertionOptions, QueueBinding } from '../__types__'

export function AssertExchange(exchange: string, type: string, options?: ExchangeAssertionOptions): ExchangeAssertion {
    return { type: 'exchange', exchange, exchange_type: type, options }
}

export function AssertQueue(queue: string, options?: QueueAssertionOptions): QueueAssertion {
    return { type: 'queue', queue, options }
}

export function BindQueue(exchange: string, queue: string, routing_key: string): QueueBinding {
    return { type: 'exchange_to_queue', exchange, queue, routing_key }
}

export function BindExchange(destination: string, source: string, routing_key: string): ExchangeBinding {
    return { type: 'exchange_to_exchange', destination, source, routing_key }
}
