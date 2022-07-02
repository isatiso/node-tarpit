/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Constructor, Disabled, get_all_prop_decorator } from '@tarpit/core'
import { ApiMethod } from '../__types__'
import { Cache, Route, TpRouter } from '../annotations'

export type RouteUnit = {
    path_tail: string
    get: boolean
    post: boolean
    put: boolean
    delete: boolean
    cache_scope: string
    cache_expire_secs: number
    position: string
    handler: Function
    cls: Constructor<any>
    prop: string | symbol
}

export function collect_routes(meta: TpRouter): RouteUnit[] {

    const units: RouteUnit[] = []

    iterate_prop: for (const [prop, decorators] of get_all_prop_decorator(meta.cls) ?? []) {
        const prop_meta: RouteUnit = {
            path_tail: prop.toString(),
            get: false,
            post: false,
            put: false,
            delete: false,
            cache_scope: '',
            cache_expire_secs: 0,
            position: `${meta.cls.name}.${prop.toString()}`,
            handler: Reflect.getOwnPropertyDescriptor(meta.cls.prototype, prop)?.value.bind(meta.instance),
            cls: meta.cls,
            prop: prop,
        }
        for (const d of decorators) {
            if (d instanceof Route) {
                prop_meta.path_tail = d.path_tail ?? prop_meta.path_tail
                d.methods.forEach(m => prop_meta[m.toLowerCase() as Lowercase<ApiMethod>] = true)
            } else if (d instanceof Cache) {
                prop_meta.cache_scope = d.scope
                prop_meta.cache_expire_secs = d.expire_secs
            } else if (d instanceof Disabled) {
                continue iterate_prop
            }
        }
        if (prop_meta.get || prop_meta.post || prop_meta.put || prop_meta.delete) {
            units.push(prop_meta)
        }
    }
    return units
}
