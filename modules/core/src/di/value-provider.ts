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

    private constructor(
        public readonly injector: Injector,
        public readonly token: any,
        private readonly value: M,
    ) {
        injector.set(token, this)
    }

    static create<M>(injector: Injector, def: ValueProviderDef<any>): ValueProvider<M> {
        injector = def.root ? injector.root : injector
        return new ValueProvider<M>(injector, def.provide, def.useValue)
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
