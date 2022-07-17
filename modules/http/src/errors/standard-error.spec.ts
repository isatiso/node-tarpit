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
import { StandardError, throw_bad_request, throw_forbidden, throw_standard_error, throw_unauthorized } from './standard-error'
import { TpHttpError } from './tp-http-error'

chai.use(cap)

describe('standard-error.ts', function() {

    describe('#throw_standard_error()', function() {

        it('should throw StandardError', function() {
            expect(() => throw_standard_error(403, { msg: 'Refused' })).to.throw('Refused')
        })

        it('should use default message of status if message is not specified', function() {
            expect(() => throw_standard_error(403)).to.throw('Forbidden')
        })

        it('should use default message of status  500 if given status not exist', function() {
            expect(() => throw_standard_error(999)).to.throw('Internal Server Error')
        })
    })

    describe('#throw_bad_request()', function() {

        it('should throw StandardError with status 400', function() {
            expect(() => throw_bad_request()).to.throw('Bad Request')
        })
    })

    describe('#throw_unauthorized()', function() {

        it('should throw StandardError with status 401', function() {
            expect(() => throw_unauthorized()).to.throw('Unauthorized')
        })
    })

    describe('#throw_forbidden()', function() {

        it('should throw StandardError with status 401', function() {
            expect(() => throw_forbidden()).to.throw('Forbidden')
        })
    })

    describe('StandardError', function() {

        it('should new instance', function() {
            const instance = new StandardError(500, 'Something Wrong')
            expect(instance).to.be.instanceof(TpHttpError)
            expect(instance).to.be.instanceof(TpError)
        })
    })
})
