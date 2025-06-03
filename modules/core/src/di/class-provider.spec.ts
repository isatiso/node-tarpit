/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { Disabled, OnTerminate, Optional, TpService } from '../annotations'
import { OnStart } from '../annotations/on-start'
import { TpLoader } from '../builtin/tp-loader'
import { Platform } from '../platform'
import { ClassProvider } from './class-provider'
import { Injector } from './injector'

chai.use(cap)

describe('class-provider.ts', function() {

    let injector: Injector

    @TpService({ inject_root: true })
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

    @TpService()
    class CLS {

        terminated = false
        started = false

        @OnStart()
        some_property = 123

        @OnTerminate()
        some_other_property = 123

        constructor(
            public a: A,
            public b: B,
            @Optional()
            public c: C,
        ) {
        }

        @Disabled()
        async some_other() {
        }

        @OnStart()
        async on_start() {
            this.started = true
        }

        @OnTerminate()
        async on_terminate() {
            this.terminated = true
        }
    }

    before(function() {
        injector = Injector.create()
        ClassProvider.create(injector, { provide: TpLoader, useClass: TpLoader })
    })

    describe('ClassProvider', function() {

        it('could create instance by static method "create"', function() {
            expect(() => ClassProvider.create(injector, { provide: AA, useClass: AA, root: true })).to.not.throw()
            expect(() => ClassProvider.create(injector, { provide: A, useClass: A })).to.not.throw()
        })

        it('should set provider to injector on init', function() {
            const provider = ClassProvider.create(injector, { provide: B, useClass: B }).set_used()
            expect(injector.get(B)).to.equal(provider)
            expect(injector.get(B)?.create()).to.be.instanceof(B)
        })

        it('should search deep dependencies on init', function() {
            const provider_cls = ClassProvider.create(injector, { provide: CLS, useClass: CLS })
            const cls = provider_cls.create()
            expect(cls).to.be.instanceof(CLS)
            expect(cls.a).to.be.instanceof(A)
            expect(cls.b).to.be.instanceof(B)
        })

        it('should set start and terminate listener if exists', async function() {
            const platform = new Platform(load_config({}))
                .import(A)
                .import(B)
                .import(AA)
                .import(CLS)

            const cls = platform.expose(CLS)
            await platform.start()
            expect(cls?.started).to.be.true
            await platform.terminate()
            expect(cls?.terminated).to.be.true
        })
    })
})
