/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Deque, DI_TOKEN, MetaTools, TpMetaWrapper } from '@tarpit/core'
import { TpConsumerUnit, TpProducerUnit } from '../__types__'

export { BindExchange, BindQueue, AssertQueue, AssertExchange } from './annotation-tools'

export const ConsumerUnit = TpMetaWrapper<TpConsumerUnit<any>>(DI_TOKEN.unit, 'property_only',
    <T extends (...args: any) => any>(prototype: any, property?: string | symbol): TpConsumerUnit<T> => {
        const [descriptor, prop] = MetaTools.check_property(prototype, property)
        const parameter_injection = MetaTools.default_property_meta(prototype, prop).value.parameter_injection
        const consumer_unit: TpConsumerUnit<T> = {
            type: 'TpConsumerUnit',
            prototype,
            descriptor,
            property: prop,
            param_types: MetaTools.get_method_parameter_types(prototype, prop)?.map((t: any, i: number) => parameter_injection[i] ?? t) as Parameters<T>,
            handler: descriptor.value,
        }
        MetaTools.default_unit_record(prototype)
            .do(touched => touched.set(prop, consumer_unit))
        return consumer_unit
    })

export const ProducerUnit = TpMetaWrapper<TpProducerUnit<any>>(DI_TOKEN.unit, 'property_only',
    <T extends (...args: any) => any>(prototype: any, property?: string | symbol): TpProducerUnit<T> => {
        if (!property) {
            throw new Error('Function Decorator can not place on class.')
        }
        const producer_unit: TpProducerUnit<T> = {
            type: 'TpProducerUnit',
            prototype,
            descriptor: {},
            property,
            handler: (() => null) as any,
            produce_cache: new Deque()
        }
        MetaTools.default_unit_record(prototype)
            .do(touched => touched.set(property, producer_unit))
        return producer_unit
    })

export const default_consumer_unit = (prototype: Object, prop: string | symbol) => ConsumerUnit(prototype, prop).ensure_default()
export const default_producer_unit = (prototype: Object, prop: string | symbol) => ProducerUnit(prototype, prop).ensure_default()

