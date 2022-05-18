/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Provider } from '../__types__'

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
