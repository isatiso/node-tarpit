/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { stringify } from './stringify'

chai.use(cap)

describe('stringify.ts', function() {

    describe('stringify()', function() {

        it('should stringify string value as itself', function() {
            const m = 'some string'
            expect(stringify(m)).to.equal(m)
        })

        it('should stringify array value as [item, item, ...]', function() {
            const m = ['a', 'b', 'c', 'd']
            expect(stringify(m)).to.equal('[a, b, c, d]')
        })

        it('should stringify null value as "null"', function() {
            const m = null
            expect(stringify(m)).to.equal('null')
        })

        it('should stringify undefined value as "undefined"', function() {
            const m = undefined
            expect(stringify(m)).to.equal('undefined')
        })

        it('should stringify object as it\'s name', function() {
            expect(stringify(class Bla {
            })).to.equal('Bla')
            expect(stringify(function Swa() {
            })).to.equal('Swa')
            expect(stringify({ name: 'Boom' })).to.equal('Boom')
        })

        it('should stringify object as it\'s override_name preferentially', function() {
            expect(stringify(class Bla {
                static override_name = 'Override'
            })).to.equal('Override')
            expect(stringify({ name: 'Boom', override_name: 'Override' })).to.equal('Override')
        })

        it('will use toString method if isn\'t any one above', function() {
            expect(stringify({ some_prop: 'Boom' })).to.equal('[object Object]')
            expect(stringify(Symbol('some symbol'))).to.equal('Symbol(some symbol)')
        })

        it('will treat as null value when toString method been override and return null', function() {
            expect(stringify({ some_prop: 'Boom', toString: () => null })).to.equal('null')
        })

        it('will cut string till first new line character', function() {
            expect(stringify({ some_prop: 'Boom', toString: () => 'Type Error: a not match b\nsome explain text\nsome explain text\nsome explain text' })).to.equal('Type Error: a not match b')
        })
    })
})
