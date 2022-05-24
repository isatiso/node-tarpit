/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { KeyOfFilterType } from '@tarpit/core'

import { default_producer_unit } from '../__tools__'
import { ProduceOptions, Producer } from '../__types__'

export function Produce<T extends object, K extends KeyOfFilterType<T, Producer<any>>>(exchange: string, routing_key: string, options?: ProduceOptions): PropertyDecorator {
    return (prototype, prop) => {
        default_producer_unit(prototype, prop)
            .do(unit => {
                if (unit.produce) {
                    throw new Error('Duplicated decorator "Produce".')
                } else {
                    unit.produce = { exchange, routing_key, options: options ?? {} }
                    const producer: Producer<any> = (message: any, produce_options?: ProduceOptions): Promise<void> => {
                        return new Promise((resolve, reject) => {
                            unit.produce_cache.push([message, produce_options, resolve, reject])
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
