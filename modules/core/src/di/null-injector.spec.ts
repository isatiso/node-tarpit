/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { NullInjector } from './null-injector'

chai.use(cap)

describe('null-injector.ts', function() {
    describe('NullInjector', function() {
        it('could create instance by new operator', function() {
            expect(() => new NullInjector()).to.not.throw()
        })

        it('should always return false by "has" method', function() {
            expect(new NullInjector().has('')).to.be.false
            expect(new NullInjector().has(123)).to.be.false
        })

        it('should always return undefined by "get" method', function() {
            expect(new NullInjector().get('')).to.be.undefined
            expect(new NullInjector().get(123)).to.be.undefined
        })
    })
})
