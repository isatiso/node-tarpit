/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Provider, ValueProviderDef } from '../types'
import { Injector } from './injector'

export class ValueProvider<M> implements Provider<M> {

    public used = false
    private value: any

    private constructor(
        public readonly injector: Injector,
        public readonly token: any,
        value: M,
        private readonly multi: boolean
    ) {
        injector.set(token, this)
        ValueProvider.set_value(this, value, multi)
    }

    static create<M>(injector: Injector, def: ValueProviderDef<any>): ValueProvider<M> {
        injector = def.root ? injector.root : injector
        const exist_provider = injector.get(def.provide) as ValueProvider<M>
        if (!exist_provider) {
            return new ValueProvider<M>(injector, def.provide, def.useValue, def.multi ?? false)
        } else {
            ValueProvider.set_value(exist_provider, def.useValue, def.multi ?? false)
            return exist_provider
        }
    }

    static set_value(provider: ValueProvider<any>, value: any, multi: boolean) {
        if (provider.multi !== multi) {
            throw new Error('Cannot mix multi providers and regular providers')
        }
        if (provider.multi) {
            provider.value = provider.value ?? []
            provider.value.push(value)
        } else {
            provider.value = value
        }
        provider.injector.emit('provider-change', provider.token)
    }

    create() {
        this.used = true
        return this.value
    }

    set_used(): this {
        this.used = true
        return this
    }
}
