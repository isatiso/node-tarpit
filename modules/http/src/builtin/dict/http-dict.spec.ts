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

            it('should return undefined if key not exist', function() {
                const instance = new HttpDict({ a: 'a', b: ['1', '2'] })
                expect(instance.get_first('c' as any)).to.be.undefined
            })

            it('should return undefined if value not match matcher', function() {
                const instance = new HttpDict({ a: 'a', b: ['1', '2'] })
                expect(instance.get_first('a', /b/)).to.be.undefined
            })

            it('should return the first value of array', function() {
                const instance = new HttpDict({ a: 'a', b: ['1', '2'] })
                expect(instance.get_first('b', /1/)).to.equal('1')
            })
        })

        describe('.get_all()', function() {

            it('should return undefined if key not exist', function() {
                const instance = new HttpDict({ a: 'a', b: ['1', '2'] })
                expect(instance.get_all('c' as any)).to.be.undefined
            })

            it('should return empty array if value not match matcher', function() {
                const instance = new HttpDict({ a: 'a', b: ['1', '2'] })
                expect(instance.get_all('a', /b/)).to.be.empty
            })

            it('should return all values of array', function() {
                const instance = new HttpDict({ a: 'a', b: ['1', '2'] })
                expect(instance.get_all('b')).to.eql(['1', '2'])
            })

            it('should return all values of array that match matcher', function() {
                const instance = new HttpDict({ a: 'a', b: ['1', '2'] })
                expect(instance.get_all('b', /1/)).to.eql(['1'])
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
