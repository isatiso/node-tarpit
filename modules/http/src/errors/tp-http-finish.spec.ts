/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpError } from '@tarpit/core'
import { describe, expect, it } from 'vitest'
import { HTTP_STATUS } from '../tools/http-status'
import { throw_http_finish, TpHttpFinish } from './tp-http-finish'

describe('tp-http-error.ts', function() {

    describe('TpHttpError', function() {

        it('should new instance', function() {
            const instance = new TpHttpFinish({ code: 'ERR.code', msg: 'something wrong', status: 500 })
            expect(instance).toBeInstanceOf(TpError)
        })

        it('should use 500 as status if given status is not Integer or out of range', function() {
            const instance = new TpHttpFinish({ code: 'ERR.code', msg: 'something wrong', status: 2 })
            expect(instance.status).toEqual(500)
        })

        it('should jsonify with fields', function() {
            const instance = new TpHttpFinish({
                code: 'ERR.code',
                msg: 'something wrong',
                status: 500,
                headers: { 'X-Reason': HTTP_STATUS.message_of(500) },
                body: HTTP_STATUS.message_of(500)
            })
            expect(instance.jsonify()).toEqual({
                    body: 'Internal Server Error',
                    code: 'ERR.code',
                    detail: undefined,
                    headers: {
                        'X-Reason': 'Internal Server Error',
                    },
                    msg: 'something wrong',
                    stack: '',
                    status: 500,
                }
            )
        })
    })

    describe('#throw_http_finish()', function() {

        it('should create a TpHttpFinish and throw out.', function() {
            expect(() => throw_http_finish(200)).toThrow(TpHttpFinish)
            expect(() => throw_http_finish(404)).toThrow(TpHttpFinish)
            expect(() => throw_http_finish(587)).toThrow(TpHttpFinish)
            try {
                throw_http_finish(200)
            } catch (e: any) {
                expect(e.status).toEqual(200)
                expect(e.msg).toEqual('OK')
            }
            try {
                throw_http_finish(404)
            } catch (e: any) {
                expect(e.status).toEqual(404)
                expect(e.msg).toEqual('Not Found')
            }
            try {
                throw_http_finish(587)
            } catch (e: any) {
                expect(e.status).toEqual(587)
                expect(e.msg).toEqual('Internal Server Error')
            }
        })
    })
})
