/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TarpitId } from '../tools/decorator'
import { detect_cycle_ref } from '../tools/detect-cycle-ref'
import { get_providers } from '../tools/get-providers'
import { stringify } from '../tools/stringify'
import { ClassProviderDef, Constructor, ParentDesc, Provider } from '../types'
import { Injector } from './injector'

export class ClassProvider<M extends object> implements Provider<M> {

    public resolved?: M
    public used = false

    private constructor(
        public readonly injector: Injector,
        public readonly token: any,
        private cls: Constructor<M>,
    ) {
        injector.set(token, this)
        injector.set_id((this.cls as any)[TarpitId], this)
        injector.provider_change(token)
    }

    static create<M extends object>(injector: Injector, def: ClassProviderDef<M>): ClassProvider<M> {
        injector = def.root ? injector.root : injector
        return new ClassProvider(injector, def.provide, def.useClass)
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

    set_used(): this {
        this.used = true
        return this
    }

    private _get_instance(parents: ParentDesc[]) {
        const position = parents.map(p => `${stringify(p.token)}${p.index !== undefined ? `[${p.index}]` : ''}`).join(' -> ')
        const param_deps = get_providers({ cls: this.cls, position }, this.injector)
        const last = parents.pop()
        const param_list = param_deps.map(({ provider }, index) => provider?.create([...parents.map(p => ({ ...p })), { ...last, index }]))
        return new this.cls(...param_list)
    }
}
