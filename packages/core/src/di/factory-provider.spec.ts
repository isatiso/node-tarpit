/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { Optional, TpService } from '../annotations'
import { ClassProvider } from './class-provider'
import { FactoryProvider } from './factory-provider'
import { Injector } from './injector'

chai.use(cap)

describe('factory-provider.ts', function() {

    let injector: Injector

    @TpService()
    class AA {
    }

    @TpService()
    class A {
        constructor(
            private _aa: AA,
        ) {
        }
    }

    @TpService()
    class B {
    }

    @TpService()
    class C {
    }

    before(function() {
        injector = Injector.create()
    })

    describe('FactoryProvider', function() {
        let ins_a: A
        const ins_b = new B()

        it('could create instance by static method "create"', function() {
            expect(() => ClassProvider.create(injector, AA, AA)).to.not.throw()
            expect(() => FactoryProvider.create(injector, A, (aa: AA) => ins_a ? ins_a : ins_a = new A(aa), [AA])).to.not.throw()
        })

        it('should set provider to injector on init', function() {
            const provider = FactoryProvider.create(injector, B, () => ins_b).set_used()
            expect(injector.get(B)).to.equal(provider)
            expect(injector.get(B)?.create()).to.be.instanceof(B)
        })

        it('should search deep dependencies on init', function() {
            const provider_factory = FactoryProvider.create(injector, 'CLS', (a: A, b: B, c: C) => [a, b, c], [A, B, [new Optional(), C]])
            const cls = provider_factory.create()
            expect(cls).to.eql([ins_a, ins_b, undefined])
        })

        it('should use parsed providers', function() {
            const provider = injector.get('CLS')
            expect(provider?.create()).to.eql([ins_a, ins_b, undefined])
        })
    })
})
