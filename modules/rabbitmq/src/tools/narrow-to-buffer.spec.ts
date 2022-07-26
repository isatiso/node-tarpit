/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { expect } from 'chai'
import { narrow_to_buffer } from './narrow-to-buffer'

describe('narrow-to-buffer.ts', function() {

    describe('#narrow_to_buffer()', function() {

        it('should convert object to buffer', function() {
            const res = narrow_to_buffer({ a: 1, b: 23, c: 'whatever' })
            expect(res).to.be.instanceof(Buffer)
            expect(res.toString('utf-8')).to.equal('{"a":1,"b":23,"c":"whatever"}')
        })

        it('should convert string to buffer', function() {
            const res = narrow_to_buffer('boom sha ka la ka')
            expect(res).to.be.instanceof(Buffer)
            expect(res.toString('utf-8')).to.equal('boom sha ka la ka')
        })

        it('should return parameter itself if it is Buffer', function() {
            const value = Buffer.from('boom sha ka la ka')
            const res = narrow_to_buffer(value)
            expect(res).to.equal(value)
        })
    })
})
