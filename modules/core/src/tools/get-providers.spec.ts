/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { describe, expect, it, vi } from 'vitest'
import 'reflect-metadata'
import { Disabled, Inject, Optional, TpService } from '../annotations'
import { ClassProvider, Injector } from '../di'
import { make_decorator } from './decorator'
import { get_providers } from './get-providers'

describe('get-providers.ts', () => {

    const injector = Injector.create()
    const s = Symbol('s')

    type TempDecorator = InstanceType<typeof TempDecorator>
    const TempDecorator = make_decorator('TempDecorator', () => ({}))

    @TpService()
    class A {
    }

    @TpService()
    class B {
    }

    @TpService()
    class O {
    }

    @TpService()
    class N {
    }

    @TpService()
    class C {

        constructor(
            @Optional()
            @TempDecorator()
            private o: O,
            private a: A,
            @Inject(B)
            @Disabled()
            private b: any,
        ) {
        }

        @Disabled()
        test(
            _b: B,
        ) {
        }

        @Disabled()
        [s](_b: B) {

        }

        @Disabled()
        test_excepts(
            _c: N
        ) {
        }

        no_decorator(_b: B) {

        }
    }

    const provider_a = ClassProvider.create(injector, { provide: A, useClass: A })
    const provider_b = ClassProvider.create(injector, { provide: B, useClass: B })

    describe('#get_providers()', () => {
        it('should get providers of specified parameters at constructor', () => {
            const providers = get_providers({ cls: C, position: 'C' }, injector)
            expect(providers[0].token).toEqual(O)
            expect(providers[0].provider).toBeUndefined()
            expect(providers[1].token).toEqual(A)
            expect(providers[1].provider).toEqual(provider_a)
            expect(providers[2].token).toEqual(B)
            expect(providers[2].provider).toEqual(provider_b)
        })

        it('should get providers of specified parameters at method', () => {
            const providers = get_providers({ cls: C, prop: 'test', position: 'C.test' }, injector)
            expect(providers[0].token).toEqual(B)
            expect(providers[0].provider).toEqual(provider_b)
        })

        it('should get providers of specified parameters at symbol method', () => {
            const providers = get_providers({ cls: C, prop: s, position: 'C.Symbol(s)' }, injector)
            expect(providers[0].token).toEqual(B)
            expect(providers[0].provider).toEqual(provider_b)
        })

        it('should ignore dependency and use itself which is specified by excepts', () => {
            const providers = get_providers({ cls: C, prop: 'test_excepts', position: 'C.test_excepts' }, injector, new Set([N]))
            expect(providers[0].token).toEqual(N)
            expect(providers[0].provider).toBeUndefined()
        })

        it('should throw errors if neither providers exists for dependency nor specified by excepts', () => {
            expect(() => get_providers({ cls: C, prop: 'test_excepts', position: 'C.test_excepts' }, injector)).toThrow(
                'Can\'t find provider of "N" at {C.test_excepts[0]}')
        })

        it('should get empty array if specified method under no decorator', () => {
            const providers = get_providers({ cls: C, prop: 'no_decorator', position: 'C.no_decorator' }, injector)
            expect(providers).toEqual([])
        })

        it('should get providers of given dependencies', () => {
            const providers = get_providers({ position: 'C.no_decorator', deps: [A, B, [new TempDecorator(), new Optional(), new Inject(N), N]] }, injector)
            expect(providers[0].token).toEqual(A)
            expect(providers[0].provider).toEqual(provider_a)
            expect(providers[1].token).toEqual(B)
            expect(providers[1].provider).toEqual(provider_b)
            expect(providers[2].token).toEqual(N)
            expect(providers[2].provider).toBeUndefined()
            expect(providers[2].decorators.length).toEqual(1)
            expect(providers[2].decorators[0]).toBeInstanceOf(TempDecorator)
        })

        it('should get empty array if given undefined', () => {
            const providers = get_providers({ position: 'C.no_decorator' }, injector)
            expect(providers).toEqual([])
        })

        it('should log an error when a parameter type is undefined (circular dependency)', () => {
            // 1. Setup a class
            class Circular {
                constructor(
                    // The type here is irrelevant, we will mock the metadata
                    public dep: any
                ) {
                }
            }

            // 2. Manually set the metadata to simulate a circular dependency issue
            Reflect.defineMetadata('design:paramtypes', [undefined], Circular)

            // 3. Spy on console.error
            const spy = vi.spyOn(console, 'error').mockImplementation(() => {
            })

            // 4. Call the function and expect it to throw (since the provider for `undefined` is not found)
            expect(() => get_providers({ cls: Circular, position: 'Circular' }, injector))
                .toThrow('Can\'t find provider of \"undefined\" at {Circular[0]}')

            // 5. Assert that the error was logged before the exception was thrown
            expect(spy).toHaveBeenCalledWith("type 'undefined' at Circular[0], if it's not specified, there maybe a circular import.")

            // 6. Clean up
            spy.mockRestore()
        })
    })
})
