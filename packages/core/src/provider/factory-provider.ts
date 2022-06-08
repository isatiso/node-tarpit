/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Inject, Optional } from '../annotations'
import { Injector } from '../injector'
import { detect_cycle_ref } from '../tools/inner/detect-cycle-ref'
import { stringify } from '../tools/stringify'
import { ParamDepsMeta, ParentDesc, Provider } from '../types'

export class FactoryProvider<M> implements Provider<M> {

    public used = false
    private providers?: Array<Provider<unknown> | undefined>

    constructor(
        public readonly injector: Injector,
        public readonly token: any,
        private factory: (...args: any[]) => M,
        private deps?: any[]
    ) {
        injector.set(token, this)
    }

    static create<M>(injector: Injector, token: any, factory: (...args: any[]) => M, deps?: any[]) {
        return new FactoryProvider<M>(injector, token, factory, deps)
    }

    create(parents?: ParentDesc[]): M {
        parents = parents ?? []
        detect_cycle_ref(this.token, parents)
        parents.push({ token: this.token })
        this.used = true
        return this._get_instance(parents)
    }

    set_used(): this {
        this.used = true
        return this
    }

    private _get_instance(parents: ParentDesc[]) {
        const provider_list = this._get_param_providers(parents)
        const last = parents.pop()
        const param_list = provider_list.map((provider, index) => provider?.create([...parents.map(p => ({ ...p })), { ...last, index }]))
        return this.factory(...param_list)
    }

    private _get_param_providers(parents?: any[]): Array<Provider<unknown> | undefined> {
        if (!this.providers) {
            this.providers = this.deps?.map((dep, i) => {
                if (dep === null || dep === undefined) {
                    return dep
                }
                const meta: ParamDepsMeta = { token: null, optional: false }
                if (Array.isArray(dep)) {
                    dep.forEach(d => {
                        if (d instanceof Optional) {
                            meta.optional = true
                        } else if (d instanceof Inject) {
                            meta.token = d.token
                        } else {
                            meta.token = d
                        }
                    })
                } else {
                    meta.token = dep
                }
                const provider = this.injector.get(meta.token)
                if (!provider && !meta.optional) {
                    const position_id = `${parents?.map(p => `${stringify(p.token)}${p.index !== undefined ? `[${p.index}]` : ''}`).join(' -> ')}[${i}]`
                    throw new Error(`Can't find provider of "${stringify(meta.token)}" in [${position_id}]`)
                }
                return provider
            }) ?? []
        }
        return this.providers
    }
}
