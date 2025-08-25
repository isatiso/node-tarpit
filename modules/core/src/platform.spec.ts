/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { Debug, TpEntry, TpModule, TpRoot, TpService, TpUnit } from './annotations'
import { TpLoader } from './builtin/tp-loader'
import { Injector } from './di'
import { Platform } from './platform'
import { get_class_decorator, make_decorator } from './tools/decorator'

Debug.log = (..._args: any[]) => undefined
describe('platform.ts', () => {

    beforeAll(() => {
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        vi.spyOn(console, 'log').mockImplementation(() => undefined)
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
    })

    afterAll(() => {
        vi.restoreAllMocks()
    })

    @Debug()
    class Noop {
    }

    @TpService()
    class Service1 {
        get_5() {
            return 5
        }
    }

    @TpModule({ providers: [Service1] })
    class Module1 {
    }

    @TpRoot({ imports: [Module1], entries: [Root1] })
    class Root1 {
    }

    describe('Platform', () => {
        it('could create instance by new operator', () => {
            expect(() => new Platform(load_config({}))).not.toThrow()
        })
    })

    describe('.import()', () => {
        it('should import ClassProviderDef to Platform', () => {
            const platform = new Platform(load_config({}))
            platform.import({ provide: Service1, useClass: Service1 })
            expect((platform as any).root_injector.get(Service1)?.create()).toBeInstanceOf(Service1)
        })

        it('should import FactoryProviderDef to Platform', () => {
            const platform = new Platform(load_config({}))
            platform.import({ provide: Service1, useFactory: () => new Service1() })
            expect((platform as any).root_injector.get(Service1)?.create()).toBeInstanceOf(Service1)
        })

        it('should import ValueProviderDef to Platform', () => {
            const platform = new Platform(load_config({}))
            platform.import({ provide: Service1, useValue: Service1 })
            expect((platform as any).root_injector.get(Service1)?.create()).toEqual(Service1)
        })

        it('should import TpService to Platform', () => {
            const platform = new Platform(load_config({}))
            platform.import(Service1)
            expect((platform as any).root_injector.get(Service1)?.create()).toBeInstanceOf(Service1)
        })

        it('should import TpModule to Platform', () => {
            const platform = new Platform(load_config({}))
            platform.import(Module1)
            expect((platform as any).root_injector.get(Module1)?.create()).toBeInstanceOf(Module1)
        })

        it('should import TpRoot to Platform', () => {
            const platform = new Platform(load_config({}))
            platform.import(Root1)
            const meta = get_class_decorator(Root1)?.find(d => d instanceof TpEntry)

            expect(meta!.injector!.get(Root1)?.create()).toBeInstanceOf(Root1)
            expect(meta!.injector!.get(Module1)?.create()).toBeInstanceOf(Module1)
            expect(meta!.injector!.get(Service1)?.create()).toBeInstanceOf(Service1)
        })

        it('should throw error if provided is not "TpComponent"', () => {
            const platform = new Platform(load_config({}))
            expect(() => platform.import(Noop)).toThrow('Noop is not a "TpComponent"')
        })
    })

    describe('.expose()', () => {
        it('should expose things from root injector', () => {
            const platform = new Platform(load_config({}))
                .import({ provide: Service1, useClass: Service1 })
            const inspector = platform.expose(Service1)
            expect(inspector).toBeInstanceOf(Service1)
        })

        it('should expose undefined from provided not exists', () => {
            const platform = new Platform(load_config({}))
            const inspector = platform.expose(Noop)
            expect(inspector).toBeUndefined()
        })
    })

    describe('.inspect_injector()', () => {
        it('should return provider tree', () => {
            const platform = new Platform(load_config({}))
            platform.import(Service1)
            const result = platform.inspect_injector()

            expect(result).toBeTypeOf('string')
            expect(result).toContain('Injector')
            expect(result).toContain('Service1 [TpWorker → @TpService]')
        })
    })

    describe('.start() && .terminate()', () => {

        const some_module_token = Symbol.for('œœ.token.SomeModule')

        const SomeDecorator = make_decorator('SomeDecorator', () => ({ token: some_module_token }), TpEntry)
        const SomeUnit = make_decorator('SomeUnit', () => ({}), TpUnit)

        @TpService()
        class SomeService {
        }

        @SomeDecorator()
        class SomeEntry {
            @SomeUnit()
            prop() {
            }
        }

        @TpModule({
            providers: [SomeService],
        })
        class SomeModule {
            public start_called = false
            public terminate_called = false
            public load_called = false

            constructor(private injector: Injector) {
                this.injector.get(TpLoader)?.create().register(some_module_token, {
                    on_start: async () => (this.start_called = true) && undefined,
                    on_terminate: async () => (this.terminate_called = true) && undefined,
                    on_load: () => this.load_called = true
                })
            }
        }

        @TpModule()
        class SomeModuleWillThrowError {
            public load_called = false

            constructor(private injector: Injector) {
                this.injector.get(TpLoader)?.create().register(some_module_token, {
                    on_start: async () => {
                        if (1 == 1) {
                            throw new Error('lkhj')
                        }
                    },
                    on_terminate: async () => {
                        if (1 == 1) {
                            throw new Error('lkhj')
                        }
                    },
                    on_load: () => this.load_called = true
                })
            }
        }

        @TpRoot({
            entries: [SomeEntry],
        })
        class SomeRoot {
            constructor(
                public s: SomeService,
            ) {
            }
        }

        it('should call all hooks', async () => {
            const platform = new Platform(load_config({}))
            platform.import(SomeModule)
            platform.import(SomeRoot)
            void platform.start()
            await platform.start()
            void platform.terminate()
            await platform.terminate()
            const instance = platform.expose(SomeModule)
            expect(instance?.start_called).toBe(true)
            expect(instance?.terminate_called).toBe(true)
            expect(instance?.load_called).toBe(true)
        })

        it('should record time after started and terminated', async () => {
            const platform = new Platform(load_config({}))
            platform.import(SomeModule)
            platform.import(SomeRoot)
            expect(platform.started_at).toEqual(-1)
            void platform.start(() => console.debug('started'))
            expect(platform.started_at).toBeCloseTo(Date.now(), -2)
            await platform.start()
            expect(platform.start_time).toBeCloseTo(Date.now() - platform.started_at, -2)
            expect(platform.terminated_at).toEqual(-1)
            void platform.terminate(() => console.debug('terminate'))
            expect(platform.terminated_at).toBeCloseTo(Date.now(), -2)
            await platform.terminate()
            expect(platform.terminate_time).toBeCloseTo(Date.now() - platform.terminated_at, -2)
            const instance = platform.expose(SomeModule)
            expect(instance?.start_called).toBe(true)
            expect(instance?.terminate_called).toBe(true)
            expect(instance?.load_called).toBe(true)
        })

        it('should catch and ignore error in hooks', () => {
            const platform = new Platform(load_config({}))
            platform.import(SomeModule)
        })
    })
})
