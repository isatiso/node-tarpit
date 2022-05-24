/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { default_consumer_unit } from '../__tools__'
import { ConsumeOptions } from '../__types__'

export function Consume(queue: string, options?: ConsumeOptions): MethodDecorator {
    return (prototype, prop, _) => {
        default_consumer_unit(prototype, prop)
            .do(unit => {
                if (unit.consume) {
                    throw new Error('Duplicated decorator "Consume".')
                } else {
                    unit.consume = { queue, options: options ?? {} }
                }
            })
    }
}
