/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { beforeAll, describe, expect, it } from 'vitest'
import { Disabled, OnTerminate, OnStart, Optional, TpService } from '../annotations'
import { TpLoader } from '../builtin/tp-loader'
import { Platform } from '../platform'
import { ClassProvider } from './class-provider'
import { Injector } from './injector'

describe('class-provider.ts', () => {

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

    beforeAll(() => {
        injector = Injector.create()
        ClassProvider.create(injector, { provide: TpLoader, useClass: TpLoader })
    })

    describe('ClassProvider', () => {

        it('could create instance by static method "create"', () => {
            expect(() => ClassProvider.create(injector, { provide: AA, useClass: AA, root: true })).not.toThrow()
            expect(() => ClassProvider.create(injector, { provide: A, useClass: A })).not.toThrow()
        })

        it('should set provider to injector on init', () => {
            const provider = ClassProvider.create(injector, { provide: B, useClass: B }).set_used()
            expect(injector.get(B)).toEqual(provider)
            expect(injector.get(B)?.create()).toBeInstanceOf(B)
        })

        it('should search deep dependencies on init', () => {
            ClassProvider.create(injector, { provide: A, useClass: A })
            ClassProvider.create(injector, { provide: B, useClass: B })
            const provider_cls = ClassProvider.create(injector, { provide: CLS, useClass: CLS })
            const cls = provider_cls.create()
            expect(cls).toBeInstanceOf(CLS)
            expect(cls.a).toBeInstanceOf(A)
            expect(cls.b).toBeInstanceOf(B)
        })

        it('should set start and terminate listener if exists', async () => {
            const platform = new Platform(load_config({}))
                .import(A)
                .import(B)
                .import(AA)
                .import(CLS)

            const cls = platform.expose(CLS)
            await platform.start()
            expect(cls?.started).toBe(true)
            await platform.terminate()
            expect(cls?.terminated).toBe(true)
        })
    })
})
