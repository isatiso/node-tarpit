/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { get_consumer_unit } from '../__tools__'
import { ConsumeOptions } from '../__types__'

export function Consume(queue: string, options?: ConsumeOptions): MethodDecorator {
    return (prototype, prop, _) => {
        get_consumer_unit(prototype, prop)
            .ensure_default()
            .do(unit => {
                if (unit.consume) {
                    throw new Error('Duplicated decorator "Consume".')
                } else {
                    unit.consume = { queue, options: options ?? {} }
                }
            })
    }
}
