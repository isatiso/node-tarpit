/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { DecoratorInstanceMethod } from '@tarpit/core'
import { get_consumer_function } from '../__tools__'
import { ConsumeOptions } from '../__types__'

export function Consume(queue: string, options?: ConsumeOptions): DecoratorInstanceMethod {
    return (prototype, prop, _) => {
        get_consumer_function(prototype, prop)
            .ensure_default()
            .do(amqp_function => {
                if (amqp_function.consume) {
                    throw new Error('Duplicated decorator "Consume".')
                } else {
                    amqp_function.consume = { queue, options: options ?? {} }
                }
            })
    }
}
