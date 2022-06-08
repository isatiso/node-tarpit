/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import 'reflect-metadata'
import { Inject, Optional } from '../annotations'
import { Injector } from '../injector'
import { Constructor, ParamDepsMeta } from '../types'
import { get_method_parameter_decorator, get_param_types } from './tp-decorator'
import { resolve_forward_ref } from './tp-forward-ref'

function get_param_deps(cls: Constructor<any>, prop: string | symbol) {
    const param_meta = get_method_parameter_decorator(cls, prop)
    const param_deps: ParamDepsMeta[] = get_param_types(cls, prop)?.map((p: any, index: number) => {
        const desc = { token: p, optional: false }
        param_meta[index]?.forEach((d: any) => {
            if (d instanceof Optional) {
                desc.optional = true
            } else if (d instanceof Inject) {
                desc.token = d.token
            }
        })
        return desc
    }) ?? []
    return param_deps
}

export function get_providers(meta: { cls: Constructor<any>, prop: string | symbol, position: string }, injector: Injector, except_list?: Set<any>): any[] {
    return get_param_deps(meta.cls, meta.prop)?.map((param_meta, i) => {
        if (param_meta.token === null || param_meta.token === undefined) {
            console.error(`type 'undefined' at ${meta.position}[${i}], if it's not specified, there maybe a circular import.`)
        }
        param_meta.token = resolve_forward_ref(param_meta.token)
        if (except_list?.has(param_meta.token)) {
            return param_meta.token
        }
        const provider = injector.get(param_meta.token)
        if (!provider && !param_meta.optional) {
            throw new Error(`Can't find provider of "${param_meta.token?.name ?? param_meta.token}" in [${meta.position}, args[${i}]]`)
        }
        return provider
    }) ?? []
}
