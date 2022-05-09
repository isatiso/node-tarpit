/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Deque, DI_TOKEN, MetaTools, MetaWrapper, TokenTools } from '@tarpit/core'
import { ConsumerFunction, ProducerFunction } from '../__types__'

export { BindExchange, BindQueue, AssertQueue, AssertExchange } from './annotation-tools'

export const get_consumer_function = MetaWrapper<ConsumerFunction<any>>(DI_TOKEN.property_function, 'property_only', <T extends (...args: any) => any>(prototype: any, property?: string): ConsumerFunction<T> => {
    const [descriptor, prop] = MetaTools.check_property(prototype, property)
    const parameter_injection = MetaTools.PropertyMeta(prototype, prop).value?.parameter_injection
    const consumer_function: ConsumerFunction<T> = {
        type: 'TpConsumerFunction',
        prototype,
        descriptor: descriptor,
        property: prop,
        param_types: MetaTools.get_method_parameter_types(prototype, prop)?.map((t: any, i: number) => parameter_injection?.[i] ?? t) as Parameters<T>,
        handler: descriptor.value,
    }
    TokenTools.Touched(prototype).ensure_default().do(touched => {
        touched[prop] = consumer_function
    })
    return consumer_function
})

export const get_producer_function = MetaWrapper<ProducerFunction<any>>(DI_TOKEN.property_function, 'property_only', <T extends (...args: any) => any>(prototype: any, property?: string): ProducerFunction<T> => {
    if (!property) {
        throw new Error('Function Decorator can not place on class.')
    }
    const producer_function: ProducerFunction<T> = {
        type: 'TpProducerFunction',
        prototype,
        descriptor: {},
        property: property,
        handler: (() => null) as any,
        produce_cache: new Deque()
    }
    TokenTools.Touched(prototype).ensure_default().do(touched => {
        touched[property] = producer_function
    })
    return producer_function
})

