/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import 'reflect-metadata'
import { OnDestroy } from '../annotations'
import { TpInspector } from '../builtin/tp-inspector'
import { Injector } from '../injector'
import { get_providers } from '../tools/get-providers'
import { detect_cycle_ref } from '../tools/inner/detect-cycle-ref'
import { stringify } from '../tools/stringify'
import { get_all_prop_decorator } from '../tools/tp-decorator'
import { Constructor, ParentDesc, Provider } from '../types'

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
                this.injector.get(TpInspector)?.create().mark_quit_hook(destroy_method)
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
            const position = parents?.map(p => `${stringify(p.token)}${p.index !== undefined ? `[${p.index}]` : ''}`).join(' -> ')
            this.providers = get_providers({ cls: this.cls, position }, this.injector)
        }
        return this.providers
    }
}
