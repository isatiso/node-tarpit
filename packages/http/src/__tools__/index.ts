/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { DI_TOKEN, MetaTools, TpMetaWrapper } from '@tarpit/core'
import { RouterFunction } from '../__types__'

export * from './gunslinger'

export const get_router_function = TpMetaWrapper<RouterFunction<any>>(DI_TOKEN.property_function, 'property_only',
    <T extends (...args: any) => any>(prototype: any, property?: string | symbol): RouterFunction<T> => {

        const [descriptor, prop] = MetaTools.check_property(prototype, property)
        const parameter_injection = MetaTools.PropertyMeta(prototype, prop).value?.parameter_injection
        const router_function: RouterFunction<T> = {
            type: 'TpRouterFunction',
            prototype,
            path: typeof prop === 'symbol' ? prop.toString() : prop,
            descriptor: descriptor,
            handler: descriptor.value,
            property: prop,
            param_types: MetaTools.get_method_parameter_types(prototype, prop)?.map((t: any, i: number) => parameter_injection?.[i] ?? t) as Parameters<T>,
            auth: false,
            wrap_result: true,
        }
        MetaTools.FunctionRecord(prototype).ensure_default().do(touched => {
            touched[prop] = router_function
        })
        return router_function
    })
