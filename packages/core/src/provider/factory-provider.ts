/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Injector } from '../injector'
import { get_providers } from '../tools/get-providers'
import { detect_cycle_ref } from '../tools/inner/detect-cycle-ref'
import { stringify } from '../tools/stringify'
import { ParentDesc, Provider } from '../types'

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
        if (!this.providers) {
            const position = parents?.map(p => `${stringify(p.token)}${p.index !== undefined ? `[${p.index}]` : ''}`).join(' -> ') ?? ''
            this.providers = get_providers({ position, deps: this.deps }, this.injector)
        }
        const last = parents.pop()
        const param_list = this.providers.map((provider, index) => provider?.create([...parents.map(p => ({ ...p })), { ...last, index }]))
        return this.factory(...param_list)
    }
}
