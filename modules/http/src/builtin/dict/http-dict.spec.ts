/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Jtl } from '@tarpit/judge'
import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { HttpDict } from './http-dict'

chai.use(cap)

describe('http-dict.ts', function() {

    describe('HttpDict', function() {

        it('should new instance', function() {
            const instance = new HttpDict({ a: 'a', b: ['1', '2'] })
            expect(instance.data).to.eql({ a: 'a', b: ['1', '2'] })
        })

        describe('.get_first()', function() {

            it('should get first element if value is an array', function() {
                const instance = new HttpDict({ a: 'a', b: ['1', '2'] })
                expect(instance.get_first('b')).to.equal('1')
            })

            it('should return value self if not array', function() {
                const instance = new HttpDict({ a: 'a', b: ['1', '2'] })
                expect(instance.get_first('a')).to.equal('a')
            })
        })

        describe('.ensure()', function() {

            it('should check matcher to the get_first() result of value', function() {
                const instance = new HttpDict({ a: 'a', b: ['1', '2'] })
                expect(instance.ensure('a', Jtl.string)).to.equal('a')
                expect(() => instance.ensure('a', Jtl.number)).to.throw('Value of [a] does not match the rule: [is number]')
            })
        })
    })
})
