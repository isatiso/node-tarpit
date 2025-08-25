/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { describe, it, expect } from 'vitest'
import { decode } from './common'

describe('common.ts', function() {

    describe('#decode()', function() {
        it('should decode gbk content into string', function() {
            const raw = Buffer.from([0xd6, 0xd0, 0xb9, 0xfa, 0x61, 0x62, 0x63])
            expect(decode(raw, 'gbk')).toEqual('中国abc')
        })
    })
})
