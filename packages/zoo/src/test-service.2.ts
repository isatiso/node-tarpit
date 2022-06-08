/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Inject, Optional, TpService } from '@tarpit/core'

export const SymbolToken = Symbol('TestblablbaService2')

@TpService()
export class TestService2 {
    constructor(
        @Optional()
        @Inject('œœ-TpStartedAt1111111')
        private aaa: number,
        // private ts: TestService1
    ) {
        // console.log('TestService1', ts)
    }
}
