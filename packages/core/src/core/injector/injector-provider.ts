/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Provider } from '../provider'
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
