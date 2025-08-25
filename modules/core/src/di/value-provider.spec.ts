/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { Injector } from './injector'
import { ValueProvider } from './value-provider'

describe('value-provider.ts', () => {

    let injector: Injector
    beforeAll(() => {
        injector = Injector.create()
    })

    describe('ValueProvider', () => {

        it('could create instance by static method "create"', () => {
            expect(() => ValueProvider.create(injector, { provide: 'a', useValue: 123 })).not.toThrow()
        })

        it('should set provider to injector on init', () => {
            const provider = ValueProvider.create(injector, { provide: 'b', useValue: 456, root: true })
            expect(injector.get('b')).toEqual(provider)
            expect(injector.get('b')?.create()).toEqual(456)
        })
    })
})
