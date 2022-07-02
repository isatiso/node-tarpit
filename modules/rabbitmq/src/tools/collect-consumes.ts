/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Constructor, Disabled, get_all_prop_decorator } from '@tarpit/core'
import { Options } from 'amqplib'
import { Consume, TpConsumer } from '../annotations'

export type ConsumeUnit = {
    queue: string
    options: Options.Consume

    position: string
    handler: Function
    cls: Constructor<any>
    prop: string | symbol
}

export function collect_consumes(meta: TpConsumer): ConsumeUnit[] {
    const units: ConsumeUnit[] = []
    iterate_prop: for (const [prop, decorators] of get_all_prop_decorator(meta.cls) ?? []) {
        const prop_meta: ConsumeUnit = {
            queue: '',
            options: {},
            position: `${meta.cls.name}.${prop.toString()}`,
            handler: Reflect.getOwnPropertyDescriptor(meta.cls.prototype, prop)?.value.bind(meta.instance),
            cls: meta.cls,
            prop: prop,
        }
        for (const d of decorators) {
            if (d instanceof Consume) {
                prop_meta.queue = d.queue
                prop_meta.options = { ...prop_meta.options, ...d.options }
            } else if (d instanceof Disabled) {
                continue iterate_prop
            }
        }
        if (prop_meta.queue) {
            units.push(prop_meta)
        }
    }
    return units
}
