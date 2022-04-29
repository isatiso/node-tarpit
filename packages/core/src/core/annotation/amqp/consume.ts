/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TokenUtils } from '../../token-utils'
import { DecoratorInstanceMethod } from '../__types__'
import { ConsumeOptions } from './__types__'

export function Consume(queue: string, options?: ConsumeOptions): DecoratorInstanceMethod {
    return (prototype, prop, _) => {
        TokenUtils.ConsumerFunction(prototype, prop)
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
