/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { describe, expect, it } from 'vitest'
import { stringify } from './stringify'

describe('stringify.ts', () => {

    describe('#stringify()', () => {

        it('should stringify string value as itself', () => {
            const m = 'some string'
            expect(stringify(m)).toEqual(m)
        })

        it('should stringify array value as [item, item, ...]', () => {
            const m = ['a', 'b', 'c', 'd']
            expect(stringify(m)).toEqual('[a, b, c, d]')
        })

        it('should stringify null value as "null"', () => {
            const m = null
            expect(stringify(m)).toEqual('null')
        })

        it('should stringify undefined value as "undefined"', () => {
            const m = undefined
            expect(stringify(m)).toEqual('undefined')
        })

        it('should stringify object as it\'s name', () => {
            expect(stringify(class Bla {
            })).toEqual('Bla')
            expect(stringify(function Swa() {
            })).toEqual('Swa')
            expect(stringify({ name: 'Boom' })).toEqual('Boom')
        })

        it('should stringify object as it\'s override_name preferentially', () => {
            class Bla {
                static override_name = 'Override'
            }

            expect(stringify(Bla)).toEqual('Override')
            expect(stringify({ name: 'Boom', override_name: Bla.override_name })).toEqual(Bla.override_name)
        })

        it('will use toString method if isn\'t any one above', () => {
            expect(stringify({ some_prop: 'Boom' })).toEqual('[object Object]')
            expect(stringify(Symbol('some symbol'))).toEqual('Symbol(some symbol)')
        })

        it('will treat as null value when toString method been override and return null', () => {
            expect(stringify({ some_prop: 'Boom', toString: () => null })).toEqual('null')
        })

        it('will cut string till first new line character', () => {
            expect(stringify({ some_prop: 'Boom', toString: () => 'Type Error: a not match b\nsome explain text\nsome explain text\nsome explain text' })).toEqual('Type Error: a not match b')
        })
    })
})
