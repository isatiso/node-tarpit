/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { describe, expect, it } from 'vitest'
import { NullInjector } from './null-injector'

describe('null-injector.ts', () => {
    describe('NullInjector', () => {
        it('could create instance by new operator', () => {
            expect(() => new NullInjector()).not.toThrow()
        })

        it('should always return false by "has" method', () => {
            expect(new NullInjector().has('')).toBe(false)
            expect(new NullInjector().has(123)).toBe(false)
        })

        it('should always return undefined by "get" method', () => {
            expect(new NullInjector().get('')).toBeUndefined()
            expect(new NullInjector().get(123)).toBeUndefined()
        })
    })
})
