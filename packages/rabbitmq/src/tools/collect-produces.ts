/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Constructor, Disabled, get_all_prop_decorator } from '@tarpit/core'
import { Options } from 'amqplib'
import { Enqueue, Publish, TpProducer } from '../annotations'

export type ProduceUnit = {
    target: string
    routing_key: string | undefined
    options: Options.Publish

    position: string
    handler: Function
    cls: Constructor<any>
    prop: string | symbol
}

export function collect_produces(meta: TpProducer): ProduceUnit[] {
    const units: ProduceUnit[] = []
    iterate_prop: for (const [prop, decorators] of get_all_prop_decorator(meta.cls) ?? []) {
        const prop_meta: ProduceUnit = {
            target: '',
            routing_key: '',
            options: {},
            position: `${meta.cls.name}.${prop.toString()}`,
            handler: Reflect.getOwnPropertyDescriptor(meta.cls.prototype, prop)?.value.bind(meta.instance),
            cls: meta.cls,
            prop: prop,
        }
        for (const d of decorators) {
            if (d instanceof Publish) {
                prop_meta.target = d.exchange
                prop_meta.routing_key = d.routing_key
                prop_meta.options = { ...prop_meta.options, ...d.options }
            } else if (d instanceof Enqueue) {
                prop_meta.target = d.queue
                prop_meta.options = { ...prop_meta.options, ...d.options }
                continue iterate_prop
            } else if (d instanceof Disabled) {
                continue iterate_prop
            }
        }
        if (prop_meta.target) {
            units.push(prop_meta)
        }
    }
    return units
}
