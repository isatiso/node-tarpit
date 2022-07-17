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
import { BusinessError, throw_business } from './business-error'
import { TpHttpError } from './tp-http-error'

chai.use(cap)

describe('business-error.ts', function() {

    describe('#throw_business()', function() {

        it('should throw BusinessError', function() {
            expect(() => throw_business('ERR.reset', 'something wrong')).to.throw('something wrong')
        })
    })

    describe('BusinessError', function() {

        it('should new instance', function() {
            const instance = new BusinessError('ERR.whatever', 'Something Wrong')
            expect(instance).to.be.instanceof(TpHttpError)
            expect(instance).to.be.instanceof(TpError)
        })

        it('should use status 200', function() {
            const instance = new BusinessError('ERR.whatever', 'Something Wrong')
            expect(instance).to.have.property('status').which.equal(200)
        })
    })
})
