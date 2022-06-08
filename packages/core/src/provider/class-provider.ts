/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import 'reflect-metadata'
import { Inject, OnDestroy, Optional } from '../annotations'
import { Stranger } from '../builtin/stranger'
import { Injector } from '../injector'
import { detect_cycle_ref } from '../tools/inner/detect-cycle-ref'
import { stringify } from '../tools/stringify'
import { get_all_prop_decorator, get_class_parameter_decorator, get_param_types } from '../tools/tp-decorator'
import { resolve_forward_ref } from '../tools/tp-forward-ref'
import { Constructor, ParamDepsMeta, ParentDesc, Provider } from '../types'

function get_param_deps(cls: Constructor<any>) {
    const param_meta = get_class_parameter_decorator(cls)
    const param_deps: ParamDepsMeta[] = get_param_types(cls)?.map((p: any, index: number) => {
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

export class ClassProvider<M extends object> implements Provider<M> {

    public resolved?: M
    public name: string
    public used = false
    private providers?: any[]

    constructor(
        public readonly injector: Injector,
        public readonly token: any,
        private cls: Constructor<M>,
    ) {
        this.name = cls.name
        injector.set(token, this)
    }

    static create<M extends object>(injector: Injector, token: any, cls: Constructor<M>,) {
        return new ClassProvider(injector, token, cls)
    }

    create(parents?: ParentDesc[]): M {
        parents = parents ?? []
        detect_cycle_ref(this.token, parents)
        parents.push({ token: this.token })
        this.used = true
        if (!this.resolved) {
            this.resolved = this._get_instance(parents)
        }
        return this.resolved
    }

    set_used(parents?: ParentDesc[]): this {
        this.used = true
        this._set_param_used([{ token: this.cls }, ...parents ?? []])
        return this
    }

    private _get_instance(parents: ParentDesc[]) {
        const provider_list = this._get_param_providers(parents)
        const last = parents.pop()
        const param_list = provider_list.map((provider, index) => provider?.create([...parents.map(p => ({ ...p })), { ...last, index }]))
        const instance = new this.cls(...param_list)

        for (const [prop, decorators] of get_all_prop_decorator(this.cls) ?? []) {
            const meta: OnDestroy = decorators.find(d => d instanceof OnDestroy)
            if (meta) {
                const destroy_method = Reflect.get(this.cls.prototype, prop)?.bind(instance)
                const stranger = this.injector.get(Stranger)?.create()
                const announcer = new Promise<void>(resolve => {
                    this.injector.once('terminate', () => {
                        Promise.resolve(destroy_method()).then(() => resolve())
                    })
                })
                stranger?.mark(announcer)
                break
            }
        }

        return instance
    }

    private _set_param_used(parents: ParentDesc[]) {
        this._get_param_providers(parents)?.forEach(provider => provider?.set_used(parents))
    }

    private _get_param_providers(parents: ParentDesc[]): Array<Provider<unknown> | null> {
        if (!this.providers) {
            this.providers = get_param_deps(this.cls)?.map((param_meta, i) => {
                if (param_meta.token === null || param_meta.token === undefined) {
                    console.error(`type 'undefined' at ${stringify(this.cls)}[${i}], if it's not specified, there maybe a circular import.`)
                }
                param_meta.token = resolve_forward_ref(param_meta.token)
                const provider = this.injector.get(param_meta.token)
                if (!provider && !param_meta.optional) {
                    const position_id = `${parents?.map(p => `${stringify(p.token)}${p.index !== undefined ? `[${p.index}]` : ''}`).join(' -> ')}[${i}]`
                    throw new Error(`Can't find provider of "${stringify(param_meta.token)}" in [${position_id}]`)
                }
                return provider
            }) ?? []
        }
        return this.providers
    }
}
