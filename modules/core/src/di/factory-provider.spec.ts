/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { Optional, TpService } from '../annotations'
import { ClassProvider } from './class-provider'
import { FactoryProvider } from './factory-provider'
import { Injector } from './injector'

describe('factory-provider.ts', () => {

    let injector: Injector

    @TpService()
    class AA {
    }

    @TpService()
    class A {
        constructor(
            public _aa: AA,
        ) {
        }
    }

    @TpService()
    class B {
    }

    @TpService()
    class C {
    }

    beforeAll(() => {
        injector = Injector.create()
    })

    describe('FactoryProvider', () => {
        let ins_a: A
        const ins_b = new B()

        it('could create instance by static method "create"', () => {
            expect(() => ClassProvider.create(injector, { provide: AA, useClass: AA })).not.toThrow()
            expect(() => FactoryProvider.create(injector, { provide: A, useFactory: (aa: AA) => ins_a ? ins_a : ins_a = new A(aa), deps: [AA] })).not.toThrow()
        })

        it('should set provider to injector on init', () => {
            const provider = FactoryProvider.create(injector, { provide: B, useFactory: () => ins_b, root: true }).set_used()
            expect(injector.get(B)).toEqual(provider)
            expect(injector.get(B)?.create()).toBeInstanceOf(B)
        })

        it('should search deep dependencies on init', () => {
            const provider_factory = FactoryProvider.create(injector, { provide: 'CLS', useFactory: (a: A, b: B, c: C) => [a, b, c], deps: [A, B, [new Optional(), C]] })
            const cls = provider_factory.create()
            expect(cls).toEqual([ins_a, ins_b, undefined])
        })

        it('should use parsed providers', () => {
            const provider = injector.get('CLS')
            expect(provider?.create()).toEqual([ins_a, ins_b, undefined])
        })
    })
})
