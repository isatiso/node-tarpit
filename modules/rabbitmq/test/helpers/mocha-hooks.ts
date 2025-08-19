/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { setup_rabbitmq, teardown_rabbitmq } from './test-helper'

export const mochaHooks = {
    async beforeAll(this: Mocha.Context) {
        // Set a long timeout for container startup
        this.timeout(30000)
        await setup_rabbitmq()
    },

    async afterAll(this: Mocha.Context) {
        // Set a long timeout for container shutdown
        this.timeout(10000)
        await teardown_rabbitmq()
    }
}
