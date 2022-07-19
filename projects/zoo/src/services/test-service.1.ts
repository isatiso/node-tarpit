/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '@tarpit/core'
import { TestService2 } from './test-service.2'

@TpService()
export class TestService1 {
    constructor(
        // @Inject(forwardRef(() => TestService2))
        private ts: TestService2
    ) {
        console.log('TestService2', ts)
    }
}



