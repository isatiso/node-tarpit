/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { symbol_token, SymbolToken } from './symbol-token'

chai.use(cap)

describe('symbol-token.ts', function() {

    describe('SymbolToken', function() {

        it('should add symbol token property', async function() {

            @SymbolToken('asd')
            class Some {
            }

            for (const key of Object.keys(Some)) {
                expect(key).to.not.equal(symbol_token)
            }

            expect((Some as any)[symbol_token]).to.equal(Symbol.for('œœ.replaced.token.asd.Some'))
        })
    })
})
