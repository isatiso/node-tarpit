/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Constructor, Disabled, get_all_prop_decorator } from '@tarpit/core'
import { ApiMethod } from '../__types__'
import { Auth, CacheUnder, Route, TpRouter } from '../annotations'

export type RouteUnit = {
    path_tail: string
    methods: Set<ApiMethod>
    auth: boolean
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
        const descriptor = Reflect.getOwnPropertyDescriptor(meta.cls.prototype, prop)
        if (!descriptor) {
            continue
        }
        const prop_meta: RouteUnit = {
            path_tail: prop.toString(),
            methods: new Set<ApiMethod>(),
            cache_scope: '',
            cache_expire_secs: 0,
            auth: false,
            position: `${meta.cls.name}.${prop.toString()}`,
            handler: descriptor.value.bind(meta.instance),
            cls: meta.cls,
            prop: prop,
        }
        for (const d of decorators) {
            if (d instanceof Route) {
                prop_meta.path_tail = d.path_tail ?? prop_meta.path_tail
                d.methods.forEach(m => prop_meta.methods.add(m.toUpperCase() as any))
            } else if (d instanceof CacheUnder) {
                prop_meta.cache_scope = d.scope
                prop_meta.cache_expire_secs = d.expire_secs
            } else if (d instanceof Auth) {
                prop_meta.auth = true
            } else if (d instanceof Disabled) {
                continue iterate_prop
            }
        }
        if (prop_meta.methods.size) {
            units.push(prop_meta)
        }
    }
    return units
}
