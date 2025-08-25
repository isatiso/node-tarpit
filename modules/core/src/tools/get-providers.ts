/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import 'reflect-metadata'
import { Inject, Optional } from '../annotations'
import { Injector } from '../di'
import { Constructor, Provider } from '../types'
import { get_class_parameter_decorator, get_method_parameter_decorator, get_param_types } from './decorator'
import { stringify } from './stringify'

export interface ParamDepsMeta {
    token: any
    optional: boolean
    decorators: any[]
    provider?: Provider<any>
}

function get_param_deps(cls: Constructor<any>, prop?: string | symbol): ParamDepsMeta[] {
    const param_meta = prop
        ? get_method_parameter_decorator(cls, prop)
        : get_class_parameter_decorator(cls)
    return get_param_types(cls, prop)?.map((p: any, index: number) => {
        const meta: ParamDepsMeta = { token: p, optional: false, decorators: [] }
        param_meta[index]?.forEach((d: any) => {
            if (d instanceof Optional) {
                meta.optional = true
            } else if (d instanceof Inject) {
                meta.token = d.token
            } else {
                meta.decorators.push(d)
            }
        })
        return meta
    }) ?? []
}

function figure_given_deps(deps?: any[]): ParamDepsMeta[] {
    return deps?.map((dep) => {
        const meta: ParamDepsMeta = { token: null, optional: false, decorators: [] }
        if (Array.isArray(dep)) {
            dep.forEach((d, index) => {
                if (d instanceof Optional) {
                    meta.optional = true
                } else if (d instanceof Inject) {
                    meta.token = d.token
                } else if (index !== dep.length - 1) {
                    meta.decorators.push(d)
                } else {
                    meta.token = d
                }
            })
        } else {
            meta.token = dep
        }
        return meta
    }) ?? []
}

export type ProviderDescriptor = { cls: Constructor<any>, prop?: string | symbol, position: string } | { cls?: undefined, deps?: any[], position: string }

export function get_providers(meta: ProviderDescriptor, injector: Injector, excepts?: Set<any>): ParamDepsMeta[] {
    const param_deps = meta.cls ? get_param_deps(meta.cls, meta.prop) : figure_given_deps(meta.deps)
    return param_deps.map((param_meta, i) => {
        if (param_meta.token == null) {
            console.error(`type 'undefined' at ${meta.position}[${i}], if it's not specified, there maybe a circular import.`)
        }
        if (excepts?.has(param_meta.token)) {
            return param_meta
        }
        param_meta.provider = injector.get(param_meta.token)?.set_used()
        if (!param_meta.provider && !param_meta.optional) {
            throw new Error(`Can't find provider of "${stringify(param_meta.token)}" at {${meta.position}[${i}]}`)
        }
        return param_meta
    })
}
