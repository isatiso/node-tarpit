/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpError } from '@tarpit/error'
import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { HTTP_STATUS } from '../tools/http-status'
import { TpHttpFinish } from './tp-http-finish'

chai.use(cap)

describe('tp-http-error.ts', function() {

    describe('TpHttpError', function() {

        it('should new instance', function() {
            const instance = new TpHttpFinish({ code: 'ERR.code', msg: 'something wrong', status: 500 })
            expect(instance).to.be.instanceof(TpError)
        })

        it('should use 500 as status if given status is not Integer or out of range', function() {
            const instance = new TpHttpFinish({ code: 'ERR.code', msg: 'something wrong', status: 2 })
            expect(instance.status).to.equal(500)
        })

        it('should jsonify with fields', function() {
            const instance = new TpHttpFinish({
                code: 'ERR.code',
                msg: 'something wrong',
                status: 500,
                headers: { 'X-Reason': HTTP_STATUS.message_of(500) },
                body: HTTP_STATUS.message_of(500)
            })
            expect(instance.jsonify()).to.eql({
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
})
