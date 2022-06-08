/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Injector } from '../injector'
import { Provider } from '../types'

export class ValueProvider<M> implements Provider<M> {

    public used = false

    constructor(
        public readonly injector: Injector,
        public readonly token: any,
        private readonly value: M,
    ) {
        injector.set(token, this)
    }

    static create<M>(injector: Injector, token: any, value: M) {
        return new ValueProvider<M>(injector, token, value)
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
