/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { throw_native_error, TpError } from './tp-error'

chai.use(cap)

describe('tp-error.ts', function() {

    describe('TpError', function() {

        it('should create instance', function() {
            expect(new TpError({ code: 'err', msg: 'some message' })).to.be.instanceof(TpError)
            expect(new TpError({ code: 'err', msg: 'some message', origin: new Error('some message') })).to.be.instanceof(TpError)
            expect(new TpError({ code: 'err', msg: 'some message', origin: 'some string' })).to.be.instanceof(TpError)
        })

        it('should convert to pure object', function() {
            const { stack, ...other } = new TpError({ code: 'err', msg: 'some message', origin: new Error('lkj') }).jsonify()
            expect(other).to.eql({ code: 'err', detail: undefined, msg: 'some message' })
            expect(new TpError({ code: 'err', msg: 'some message' }).jsonify()).to.eql({ code: 'err', detail: undefined, msg: 'some message', stack: '' })
        })

        it('should convert to pure object, with specified fields', function() {
            expect(new TpError({ code: 'err', msg: 'some message' }).jsonify(['code', 'msg']))
                .to.eql({ code: 'err', msg: 'some message' })
        })
    })

    describe('throw_native_error()', function() {
        it('should throw native Error object', function() {
            expect(() => throw_native_error('some message')).to.throw('some message')
        })
    })
})
