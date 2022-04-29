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
export class FactoryProvider<M> implements Provider<M> {

    public used = false

    constructor(
        public name: string,
        private factory: (...args: any[]) => M,
        private deps?: any[]
    ) {
    }

    create() {
        this.used = true
        return this.factory(...(this.deps ?? []))
    }

    /**
     * @function mark used of provider.
     */
    set_used(): void {
        this.used = true
    }
}
