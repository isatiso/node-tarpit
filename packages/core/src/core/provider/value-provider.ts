/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Provider } from './__type__'

/**
 * @private
 *
 * @category Injector
 */
export class ValueProvider<M> implements Provider<M> {

    public used = false

    constructor(
        public name: string,
        private readonly value: M
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
