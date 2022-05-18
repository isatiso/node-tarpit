/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { DecoratorInstanceProperty, KeyOfFilterType } from '@tarpit/core'

import { get_producer_function } from '../__tools__'
import { ProduceOptions, Producer } from '../__types__'

export function Produce<T extends object, K extends KeyOfFilterType<T, Producer<any>>>(exchange: string, routing_key: string, options?: ProduceOptions): DecoratorInstanceProperty<Producer<any>> {
    return (prototype, prop) => {
        get_producer_function(prototype, prop)
            .ensure_default()
            .do(amqp_function => {
                if (amqp_function.produce) {
                    throw new Error('Duplicated decorator "Produce".')
                } else {
                    amqp_function.produce = { exchange, routing_key, options: options ?? {} }
                    const producer: Producer<any> = (message: any, produce_options?: ProduceOptions): Promise<void> => {
                        return new Promise((resolve, reject) => {
                            amqp_function.produce_cache.push([message, produce_options, resolve, reject])
                        })
                    }
                    Object.defineProperty(prototype, prop, {
                        writable: true,
                        enumerable: true,
                        configurable: true,
                        value: producer
                    })
                }
            })
    }
}
