/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Constructor, Disabled, get_all_prop_decorator, get_prop_types } from '@tarpit/core'
import { Options } from 'amqplib'
import { Enqueue, Publish, TpProducer } from '../annotations'
import { ConfirmProducer } from '../builtin/confirm-producer'
import { Producer } from '../builtin/producer'

export type ProduceUnit = {
    target: string
    routing_key?: string
    options: Options.Publish
    producer_type: typeof Producer | typeof ConfirmProducer
    position: string
    // handler: Function
    cls: Constructor<any>
    prop: string | symbol
}

export function collect_produces(meta: TpProducer): ProduceUnit[] {
    const units: ProduceUnit[] = []
    iterate_prop: for (const [prop, decorators] of get_all_prop_decorator(meta.cls) ?? []) {
        const producer_type = get_prop_types(meta.cls, prop)
        let is: 'publish' | 'enqueue' | undefined = undefined
        if (producer_type !== Producer && producer_type !== ConfirmProducer) {
            continue
        }
        const prop_meta: ProduceUnit = {
            target: '',
            options: {},
            producer_type,
            position: `${meta.cls.name}.${prop.toString()}`,
            cls: meta.cls,
            prop: prop,
        }
        for (const d of decorators) {
            if (d instanceof Publish) {
                if ((is = is ?? 'publish') !== 'publish') {
                    continue
                }
                prop_meta.target = d.exchange
                prop_meta.routing_key = d.routing_key
                prop_meta.options = d.options ?? {}
            } else if (d instanceof Enqueue) {
                if ((is = is ?? 'enqueue') !== 'enqueue') {
                    continue
                }
                prop_meta.target = d.queue
                prop_meta.options = d.options ?? {}
            } else if (d instanceof Disabled) {
                continue iterate_prop
            }
        }
        // istanbul ignore else
        if (prop_meta.target) {
            units.push(prop_meta)
        }
    }
    return units
}
