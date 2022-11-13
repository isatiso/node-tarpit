/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { HttpBodyFormatter } from './http-body-formatter'

chai.use(cap)

describe('http-response-formatter.ts', function() {

    describe('HttpResponseFormatter', function() {

        const f = new HttpBodyFormatter()

        describe('.format()', function() {

            it('should format response as simple', async function() {
                expect(f.format(null as any, { a: 1 })).to.eql({ a: 1 })
            })
        })
    })
})
