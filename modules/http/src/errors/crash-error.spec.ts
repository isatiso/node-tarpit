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
import { BusinessError } from './business-error'
import { CrashError, throw_crash } from './crash-error'
import { TpHttpFinish } from './tp-http-finish'

chai.use(cap)

describe('crash-error.ts', function() {

    describe('#throw_crash()', function() {

        it('should throw CrashError', function() {
            expect(() => throw_crash('ERR.crash', 'server crashed')).to.throw('server crashed')
        })
    })

    describe('BusinessError', function() {

        it('should new instance', function() {
            const instance = new CrashError('ERR.crash', 'server crashed')
            expect(instance).to.be.instanceof(TpHttpFinish)
            expect(instance).to.be.instanceof(TpError)
        })

        it('should use status 500', function() {
            const instance = new CrashError('ERR.crash', 'server crashed')
            expect(instance).to.have.property('status').which.equal(500)
        })
    })
})
