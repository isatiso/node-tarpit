/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Jtl } from '@tarpit/judge'
import { describe, expect, it } from 'vitest'
import { HttpDict } from './http-dict'

describe('http-dict.ts', function() {

    describe('HttpDict', function() {

        it('should new instance', function() {
            const instance = new HttpDict({ a: 'a', b: ['1', '2'] })
            expect(instance.data).toEqual({ a: 'a', b: ['1', '2'] })
        })

        describe('.get_first()', function() {

            it('should return undefined if key not exist', function() {
                const instance = new HttpDict({ a: 'a', b: ['1', '2'] })
                expect(instance.get_first('c' as any)).toBeUndefined()
            })

            it('should return undefined if value not match matcher', function() {
                const instance = new HttpDict({ a: 'a', b: ['1', '2'] })
                expect(instance.get_first('a', /b/)).toBeUndefined()
            })

            it('should return the first value of array', function() {
                const instance = new HttpDict({ a: 'a', b: ['1', '2'] })
                expect(instance.get_first('b', /1/)).toEqual('1')
            })
        })

        describe('.get_all()', function() {

            it('should return undefined if key not exist', function() {
                const instance = new HttpDict({ a: 'a', b: ['1', '2'] })
                expect(instance.get_all('c' as any)).toBeUndefined()
            })

            it('should return empty array if value not match matcher', function() {
                const instance = new HttpDict({ a: 'a', b: ['1', '2'] })
                expect(instance.get_all('a', /b/)).toEqual([])
            })

            it('should return all values of array', function() {
                const instance = new HttpDict({ a: 'a', b: ['1', '2'] })
                expect(instance.get_all('b')).toEqual(['1', '2'])
            })

            it('should return all values of array that match matcher', function() {
                const instance = new HttpDict({ a: 'a', b: ['1', '2'] })
                expect(instance.get_all('b', /1/)).toEqual(['1'])
            })
        })

        describe('.ensure()', function() {

            it('should check matcher to the get_first() result of value', function() {
                const instance = new HttpDict({ a: 'a', b: ['1', '2'] })
                expect(instance.ensure('a', Jtl.string)).toEqual('a')
                expect(() => instance.ensure('a', Jtl.number)).toThrow('Value of [a] does not match the rule: [is number]')
            })
        })
    })
})
