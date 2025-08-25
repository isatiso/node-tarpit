/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { describe, expect, it } from 'vitest'
import { Finish, finish } from './finish'

describe('finish.ts', function() {

    describe('#finish()', function() {

        it('should throw Finish', function() {
            expect(() => finish('')).toThrow(Finish)
        })
    })

    describe('Finish', function() {

        it('should new instance', function() {
            const instance = new Finish('response string')
            expect(instance.response).toEqual('response string')
        })
    })
})
