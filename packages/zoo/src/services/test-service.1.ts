/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Inject, Optional, TpService } from '@tarpit/core'
import { SymbolToken, TestService2 } from './test-service.2'

@TpService()
export class TestService1 {
    constructor(
        @Optional()
        @Inject(SymbolToken)
        private aaa: number,
        // @Inject(forwardRef(() => TestService2))
        private ts: TestService2
    ) {
        console.log('TestService2', ts)
    }
}



