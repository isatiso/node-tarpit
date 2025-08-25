/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { describe, expect, it } from 'vitest'
import { Injector } from './injector'
import { ValueProvider } from './value-provider'

describe('injector.ts', () => {

    let injector: Injector

    describe('Injector', () => {

        it('could create instance by static method "create"', () => {
            expect(() => injector = Injector.create()).not.toThrow()
        })

        it('should set provider to Injector', () => {
            const value_provider = ValueProvider.create(injector, { provide: 'a', useValue: 123 })
            const res = injector.set('b', value_provider)
            expect(res).toEqual(value_provider)
        })

        it('should get provider from Injector', () => {
            const res = injector.get('b')
            expect(res?.create()).toEqual(123)
        })

        it('should get undefined if specified token not exists', () => {
            const res = injector.get('c')
            expect(res).toBeUndefined()
        })

        it('should check if provider exists', () => {
            expect(injector.has('b')).toBe(true)
            expect(injector.has('c')).toBe(false)
        })

        it('should return undefined if given null value', () => {
            expect(injector.get(undefined as any)).toBeUndefined()
            expect(injector.get(null as any)).toBeUndefined()
            expect(injector.has(undefined as any)).toBe(false)
            expect(injector.has(null as any)).toBe(false)
        })

        it('should set id if there is one on the given class', () => {
            injector.set_id('test', injector.get('b')!)
            expect(injector.get_id('test')).toEqual(injector.get('b'))
            injector.set_id('', injector.get('b')!)
            expect(injector.get_id('')).toBeUndefined()
        })
    })
})
