/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { DI_TOKEN, MetaTools, TpMetaWrapper } from '@tarpit/core'
import { TpRouterUnit } from '../__types__'

export * from './gunslinger'

export const get_router_unit = TpMetaWrapper<TpRouterUnit<any>>(
    DI_TOKEN.unit,
    'property_only',
    <T extends (...args: any) => any>(prototype: any, property?: string | symbol): TpRouterUnit<T> => {

        const [descriptor, prop] = MetaTools.check_property(prototype, property)
        const parameter_injection = MetaTools.PropertyMeta(prototype, prop).value?.parameter_injection
        const router_unit: TpRouterUnit<T> = {
            type: 'TpRouterUnit',
            prototype,
            path: typeof prop === 'symbol' ? prop.toString() : prop,
            descriptor: descriptor,
            handler: descriptor.value,
            property: prop,
            param_types: MetaTools.get_method_parameter_types(prototype, prop)?.map((t: any, i: number) => parameter_injection?.[i] ?? t) as Parameters<T>,
            auth: false,
            wrap_result: true,
        }
        MetaTools.UnitRecord(prototype)
            .ensure_default()
            .do(touched => touched.set(prop, router_unit))
        return router_unit
    })
