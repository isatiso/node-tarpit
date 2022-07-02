/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { detect_cycle_ref } from '../tools/detect-cycle-ref'
import { get_providers, ParamDepsMeta } from '../tools/get-providers'
import { stringify } from '../tools/stringify'
import { FactoryProviderDef, ParentDesc, Provider } from '../types'
import { Injector } from './injector'

export class FactoryProvider<M> implements Provider<M> {

    public used = false
    private param_deps?: ParamDepsMeta[]

    private constructor(
        public readonly injector: Injector,
        public readonly token: any,
        private factory: (...args: any[]) => M,
        private deps?: any[]
    ) {
        injector.set(token, this)
    }

    static create<M>(injector: Injector, def: FactoryProviderDef<any>): FactoryProvider<M> {
        injector = def.root ? injector.root : injector
        return new FactoryProvider<M>(injector, def.provide, def.useFactory, def.deps)
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
        if (!this.param_deps) {
            const position = parents.map(p => `${stringify(p.token)}${p.index !== undefined ? `[${p.index}]` : ''}`).join(' -> ')
            this.param_deps = get_providers({ position, deps: this.deps }, this.injector)
        }
        const last = parents.pop()
        const param_list = this.param_deps.map(({ provider }, index) => provider?.create([...parents.map(p => ({ ...p })), { ...last, index }]))
        return this.factory(...param_list)
    }
}
