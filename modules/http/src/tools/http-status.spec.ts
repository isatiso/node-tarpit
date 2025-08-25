/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { describe, expect, it } from 'vitest'
import { HTTP_STATUS } from './http-status'

describe('http-status.ts', function() {

    describe('HTTP_STATUS', function() {

        describe('#message_of()', function() {
            it('should return message of specified http status', function() {
                expect(HTTP_STATUS.message_of(400)).toEqual('Bad Request')
            })
        })

        describe('#is_redirect()', function() {
            it('should tell given http status is redirect or not', function() {
                expect(HTTP_STATUS.is_redirect(302)).toBe(true)
                expect(HTTP_STATUS.is_redirect(200)).toBe(false)
            })
        })

        describe('#is_empty()', function() {
            it('should tell given http status is empty or not', function() {
                expect(HTTP_STATUS.is_empty(200)).toBe(false)
                expect(HTTP_STATUS.is_empty(204)).toBe(true)
            })
        })
    })
})
