/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Constructor, make_decorator } from '@tarpit/core'
import { ConsumeOptions } from '../__types__'

export type ConsumeUnit = {
    queue: string
    options: ConsumeOptions
    position: string
    handler: Function
    cls: Constructor<any>
    prop: string | symbol
}

export type Consume = InstanceType<typeof Consume>
export const Consume = make_decorator('Consume', (queue: string, options?: ConsumeOptions) => ({ options, queue }))
