/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ExchangeAssertion, ExchangeAssertionOptions, ExchangeBinding, QueueAssertion, QueueAssertionOptions, QueueBinding } from './__types__'

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
