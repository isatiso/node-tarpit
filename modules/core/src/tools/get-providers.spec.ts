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
import { make_decorator } from './decorator'
import { get_providers } from './get-providers'

chai.use(cap)

describe('get-providers.ts', function() {

    let injector = Injector.create()
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

    describe('#get_providers()', function() {
        it('should get providers of specified parameters at constructor', function() {
            const providers = get_providers({ cls: C, position: 'C' }, injector)
            expect(providers[0].token).to.equal(O)
            expect(providers[0].provider).to.be.undefined
            expect(providers[1].token).to.equal(A)
            expect(providers[1].provider).to.equal(provider_a)
            expect(providers[2].token).to.equal(B)
            expect(providers[2].provider).to.equal(provider_b)
        })

        it('should get providers of specified parameters at method', function() {
            const providers = get_providers({ cls: C, prop: 'test', position: 'C.test' }, injector)
            expect(providers[0].token).to.equal(B)
            expect(providers[0].provider).to.equal(provider_b)
        })

        it('should get providers of specified parameters at symbol method', function() {
            const providers = get_providers({ cls: C, prop: s, position: 'C.Symbol(s)' }, injector)
            expect(providers[0].token).to.equal(B)
            expect(providers[0].provider).to.equal(provider_b)
        })

        it('should ignore dependency and use itself which is specified by excepts', function() {
            const providers = get_providers({ cls: C, prop: 'test_excepts', position: 'C.test_excepts' }, injector, new Set([N]))
            expect(providers[0].token).to.equal(N)
            expect(providers[0].provider).to.be.undefined
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
            const providers = get_providers({ position: 'C.no_decorator', deps: [A, B, [new TempDecorator(), new Optional(), new Inject(N), N]] }, injector)
            expect(providers[0].token).to.equal(A)
            expect(providers[0].provider).to.equal(provider_a)
            expect(providers[1].token).to.equal(B)
            expect(providers[1].provider).to.equal(provider_b)
            expect(providers[2].token).to.equal(N)
            expect(providers[2].provider).to.be.undefined
            expect(providers[2].decorators.length).to.equal(1)
            expect(providers[2].decorators[0]).to.be.instanceof(TempDecorator)
        })

        it('should get empty array if given undefined', function() {
            const providers = get_providers({ position: 'C.no_decorator' }, injector)
            expect(providers).to.eql([])
        })
    })
})
