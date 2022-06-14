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
import { stringify } from './stringify'
import { get_class_parameter_decorator, get_method_parameter_decorator, get_param_types } from './tp-decorator'

function get_param_deps(cls: Constructor<any>, prop?: string | symbol): ParamDepsMeta[] {
    const param_meta = prop
        ? get_method_parameter_decorator(cls, prop)
        : get_class_parameter_decorator(cls)
    return get_param_types(cls, prop)?.map((p: any, index: number) => {
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
}

export function get_providers(meta: { cls: Constructor<any>, prop?: string | symbol, position: string }, injector: Injector, excepts?: Set<any>): any[] {
    return get_param_deps(meta.cls, meta.prop).map((param_meta, i) => {
        /* istanbul ignore next */
        if (param_meta.token === null || param_meta.token === undefined) {
            console.error(`type 'undefined' at ${meta.position}[${i}], if it's not specified, there maybe a circular import.`)
        }
        if (excepts?.has(param_meta.token)) {
            return param_meta.token
        }
        const provider = injector.get(param_meta.token)
        if (!provider && !param_meta.optional) {
            throw new Error(`Can't find provider of "${stringify(param_meta.token)}" at {${meta.position}[${i}]}`)
        }
        return provider
    })
}
