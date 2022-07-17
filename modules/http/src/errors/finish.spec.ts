/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { Finish, finish } from './finish'

chai.use(cap)

describe('finish.ts', function() {

    describe('#finish()', function() {

        it('should throw Finish', function() {
            expect(() => finish('')).to.throw().which.is.instanceof(Finish)
        })
    })

    describe('Finish', function() {

        it('should new instance', function() {
            const instance = new Finish('response string')
            expect(instance).to.have.property('response').which.equal('response string')
        })
    })
})
