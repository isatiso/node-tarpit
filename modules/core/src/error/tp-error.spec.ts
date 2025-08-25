/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { describe, expect, it } from 'vitest'
import { throw_native_error, TpError } from './tp-error'

describe('tp-error.ts', () => {

    describe('TpError', () => {

        it('should create instance', () => {
            expect(new TpError({ code: 'err', msg: 'some message' })).toBeInstanceOf(TpError)
            expect(new TpError({ code: 'err', msg: 'some message', origin: new Error('some message') })).toBeInstanceOf(TpError)
            expect(new TpError({ code: 'err', msg: 'some message', origin: 'some string' })).toBeInstanceOf(TpError)
        })

        it('should convert to pure object', () => {
            const { stack, ...other } = new TpError({ code: 'err', msg: 'some message', origin: new Error('lkj') }).jsonify()
            expect(other).toEqual({ code: 'err', detail: undefined, msg: 'some message' })
            const err = new TpError({ code: 'err', msg: 'some message' }).jsonify()
            expect(err.stack).toBeTypeOf('string')
            expect(err.code).toEqual('err')
            expect(err.msg).toEqual('some message')
        })

        it('should convert to pure object, with specified fields', () => {
            expect(new TpError({ code: 'err', msg: 'some message' }).jsonify(['code', 'msg']))
                .toEqual({ code: 'err', msg: 'some message' })
        })
    })

    describe('#throw_native_error()', () => {
        it('should throw native Error object', () => {
            expect(() => throw_native_error('some message')).toThrow('some message')
        })
    })
})
