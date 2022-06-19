/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { OnTerminate } from '../annotations'
import { get_all_prop_decorator } from '../tools/decorator'
import { detect_cycle_ref } from '../tools/detect-cycle-ref'
import { get_providers } from '../tools/get-providers'
import { stringify } from '../tools/stringify'
import { Constructor, ParentDesc, Provider } from '../types'
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
    }

    static create<M extends object>(injector: Injector, token: any, cls: Constructor<M>): ClassProvider<M> {
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

    set_used(): this {
        this.used = true
        return this
    }

    private _get_instance(parents: ParentDesc[]) {
        const position = parents.map(p => `${stringify(p.token)}${p.index !== undefined ? `[${p.index}]` : ''}`).join(' -> ')
        const providers = get_providers({ cls: this.cls, position }, this.injector)
        const last = parents.pop()
        const param_list = providers.map((provider, index) => provider?.create([...parents.map(p => ({ ...p })), { ...last, index }]))
        const instance = new this.cls(...param_list)

        for (const [prop, decorators] of get_all_prop_decorator(this.cls) ?? []) {
            const meta: OnTerminate = decorators.find(d => d instanceof OnTerminate)
            if (meta) {
                const destroy_method = Reflect.get(this.cls.prototype, prop)
                if (typeof destroy_method === 'function') {
                    this.injector.mark_quit_hook(destroy_method.bind(instance))
                    break
                }
            }
        }

        return instance
    }
}
