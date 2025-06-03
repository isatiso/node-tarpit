/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { OnTerminate } from '../annotations'
import { OnStart } from '../annotations/on-start'
import { TpLoader } from '../builtin/tp-loader'
import { get_all_prop_decorator, TarpitId } from '../tools/decorator'
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
        const instance = new this.cls(...param_list)

        for (const [prop, decorators] of get_all_prop_decorator(this.cls) ?? []) {
            const start_meta = decorators.find(d => d instanceof OnStart)
            if (start_meta) {
                const init_method = Reflect.get(this.cls.prototype, prop)
                if (typeof init_method === 'function') {
                    this.injector.get(TpLoader)!.create().on_start(init_method.bind(instance))
                }
            }
            const terminate_meta = decorators.find(d => d instanceof OnTerminate)
            if (terminate_meta) {
                const quit_method = Reflect.get(this.cls.prototype, prop)
                if (typeof quit_method === 'function') {
                    this.injector.get(TpLoader)!.create().on_terminate(quit_method.bind(instance))
                }
            }
        }

        return instance
    }
}
