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
