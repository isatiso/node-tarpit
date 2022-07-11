/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { decode } from './common'

chai.use(cap)

describe('common.ts', function() {

    describe('#decode()', function() {
        it('should decode gbk content into string', function() {
            const raw = Buffer.from([0xd6, 0xd0, 0xb9, 0xfa, 0x61, 0x62, 0x63])
            expect(decode(raw, 'gbk')).to.equal('中国abc')
        })
    })
})
