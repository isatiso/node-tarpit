/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Barbeque } from '@tarpit/barbeque'
import { Disabled, get_all_prop_decorator } from '@tarpit/core'
import { Consume, Produce, TpConsumer, TpProducer } from '../annotations'
import { ConsumeUnit } from '../annotations/consume'
import { ProduceUnit } from '../annotations/produce'

export { BindExchange, BindQueue, AssertQueue, AssertExchange } from './annotation-tools'

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

export function collect_produces(meta: TpProducer): ProduceUnit[] {
    const units: ProduceUnit[] = []
    iterate_prop: for (const [prop, decorators] of get_all_prop_decorator(meta.cls) ?? []) {
        const prop_meta: ProduceUnit = {
            exchange: '',
            routing_key: '',
            produce_cache: new Barbeque(),
            options: {},
            position: `${meta.cls.name}.${prop.toString()}`,
            handler: Reflect.getOwnPropertyDescriptor(meta.cls.prototype, prop)?.value.bind(meta.instance),
            cls: meta.cls,
            prop: prop,
        }
        for (const d of decorators) {
            if (d instanceof Produce) {
                prop_meta.exchange = d.exchange
                prop_meta.routing_key = d.routing_key
                prop_meta.options = { ...prop_meta.options, ...d.options }
            } else if (d instanceof Disabled) {
                continue iterate_prop
            }
        }
        if (prop_meta.exchange && prop_meta.routing_key) {
            units.push(prop_meta)
        }
    }
    return units
}
