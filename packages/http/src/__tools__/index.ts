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

export const RouterUnit = TpMetaWrapper<TpRouterUnit<any>>(DI_TOKEN.unit, 'property_only',

    (prototype: any, property?: string | symbol): TpRouterUnit<any> => {
        const [descriptor, prop] = MetaTools.check_property(prototype, property)
        const parameter_injection = MetaTools.default_property_meta(prototype, prop).value.parameter_injection
        const router_unit: TpRouterUnit<any> = {
            u_type: 'TpRouterUnit',
            u_desc: descriptor,
            u_handler: descriptor.value,
            u_param_types: MetaTools.get_method_parameter_types(prototype, prop)?.map((t: any, i: number) => parameter_injection[i] ?? t) as Parameters<any>,
            u_prop: prop,
            u_proto: prototype,
            uh_auth: false,
            uh_path: typeof prop === 'symbol' ? prop.toString() : prop,
            uh_wrap_result: true,
        }
        MetaTools.default_unit_record(prototype).do(touched => touched.set(prop, router_unit))
        return router_unit
    })

export const default_router_unit = (prototype: Object, prop: string | symbol) => RouterUnit(prototype, prop).ensure_default()
