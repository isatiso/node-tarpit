/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Provider } from '../__types__'
import { Injector } from './injector'

/**
 * @private
 *
 * Injector 中内置的 Provider。
 */
export class InjectorProvider implements Provider<Injector> {

    public used = false

    constructor(
        public name: string,
        private readonly value: Injector
    ) {
    }

    create() {
        this.used = true
        return this.value
    }

    set_used(): void {
        this.used = true
    }
}
