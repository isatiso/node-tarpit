/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { Disabled, Inject, Optional, TpService } from '../annotations'
import { ClassProvider, Injector } from '../di'
import { get_providers } from './get-providers'

chai.use(cap)

describe('get-providers.ts', function() {

    let injector = Injector.create()
    const s = Symbol('s')

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

    const provider_a = ClassProvider.create(injector, A, A)
    const provider_b = ClassProvider.create(injector, B, B)

    describe('get_providers()', function() {
        it('should get providers of specified parameters at constructor', function() {
            const providers = get_providers({ cls: C, position: 'C' }, injector)
            expect(providers).to.eql([null, provider_a, provider_b])
        })

        it('should get providers of specified parameters at method', function() {
            const providers = get_providers({ cls: C, prop: 'test', position: 'C.test' }, injector)
            expect(providers).to.eql([provider_b])
        })

        it('should get providers of specified parameters at symbol method', function() {
            const providers = get_providers({ cls: C, prop: s, position: 'C.Symbol(s)' }, injector)
            expect(providers).to.eql([provider_b])
        })

        it('should ignore dependency and use itself which is specified by excepts', function() {
            const providers = get_providers({ cls: C, prop: 'test_excepts', position: 'C.test_excepts' }, injector, new Set([N]))
            expect(providers).to.eql([N])
        })

        it('should throw errors if neither providers exists for dependency nor specified by excepts', function() {
            expect(() => get_providers({ cls: C, prop: 'test_excepts', position: 'C.test_excepts' }, injector)).to.throw(
                'Can\'t find provider of "N" at {C.test_excepts[0]}')
        })

        it('should get empty array if specified method under no decorator', function() {
            const providers = get_providers({ cls: C, prop: 'no_decorator', position: 'C.no_decorator' }, injector)
            expect(providers).to.eql([])
        })

        it('should get providers of given dependencies', function() {
            const providers = get_providers({ position: 'C.no_decorator', deps: [A, B, [new Optional(), new Inject(N), N]] }, injector)
            expect(providers).to.eql([provider_a, provider_b, null])
        })

        it('should get empty array if given undefined', function() {
            const providers = get_providers({ position: 'C.no_decorator' }, injector)
            expect(providers).to.eql([])
        })
    })
})
