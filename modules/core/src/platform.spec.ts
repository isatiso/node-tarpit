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
import spies from 'chai-spies'
import { Debug, TpEntry, TpModule, TpRoot, TpService, TpUnit } from './annotations'
import { TpLoader } from './builtin/tp-loader'
import { Injector } from './di'
import { Platform } from './platform'
import { get_class_decorator, make_decorator } from './tools/decorator'

chai.use(cap)
chai.use(spies)

Debug.log = (..._args: any[]) => undefined
describe('platform.ts', function() {

    const sandbox = chai.spy.sandbox()

    before(function() {
        sandbox.on(console, ['debug', 'log', 'info', 'warn', 'error'], () => undefined)
    })

    after(function() {
        sandbox.restore()
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

    describe('Platform', function() {
        it('could create instance by new operator', function() {
            expect(() => new Platform(load_config({}))).to.not.throw()
        })
    })

    describe('.import()', function() {
        it('should import ClassProviderDef to Platform', function() {
            const platform = new Platform(load_config({}))
            platform.import({ provide: Service1, useClass: Service1 })
            expect((platform as any).root_injector.get(Service1)?.create()).to.be.instanceof(Service1)
        })

        it('should import FactoryProviderDef to Platform', function() {
            const platform = new Platform(load_config({}))
            platform.import({ provide: Service1, useFactory: () => new Service1() })
            expect((platform as any).root_injector.get(Service1)?.create()).to.be.instanceof(Service1)
        })

        it('should import ValueProviderDef to Platform', function() {
            const platform = new Platform(load_config({}))
            platform.import({ provide: Service1, useValue: Service1 })
            expect((platform as any).root_injector.get(Service1)?.create()).to.equal(Service1)
        })

        it('should import TpService to Platform', function() {
            const platform = new Platform(load_config({}))
            platform.import(Service1)
            expect((platform as any).root_injector.get(Service1)?.create()).to.be.instanceof(Service1)
        })

        it('should import TpModule to Platform', function() {
            const platform = new Platform(load_config({}))
            platform.import(Module1)
            expect((platform as any).root_injector.get(Module1)?.create()).to.be.instanceof(Module1)
        })

        it('should import TpRoot to Platform', function() {
            const platform = new Platform(load_config({}))
            platform.import(Root1)
            const meta = get_class_decorator(Root1)?.find(d => d instanceof TpEntry)

            expect(meta.injector!.get(Root1)?.create()).to.be.instanceof(Root1)
            expect(meta.injector!.get(Module1)?.create()).to.be.instanceof(Module1)
            expect(meta.injector!.get(Service1)?.create()).to.be.instanceof(Service1)
        })

        it('should throw error if provided is not "TpComponent"', function() {
            const platform = new Platform(load_config({}))
            expect(() => platform.import(Noop)).to.throw('Noop is not a "TpComponent"')
        })
    })

    describe('.expose()', function() {
        it('should expose things from root injector', function() {
            const platform = new Platform(load_config({}))
                .import({ provide: Service1, useClass: Service1 })
            const inspector = platform.expose(Service1)
            expect(inspector).to.be.instanceof(Service1)
        })

        it('should expose undefined from provided not exists', function() {
            const platform = new Platform(load_config({}))
            const inspector = platform.expose(Noop)
            expect(inspector).to.be.undefined
        })
    })

    describe('.start() && .terminate()', function() {

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
                private s: SomeService,
            ) {
            }
        }

        it('should call all hooks', async function() {
            const platform = new Platform(load_config({}))
            platform.import(SomeModule)
            platform.import(SomeRoot)
            void platform.start()
            await platform.start()
            void platform.terminate()
            await platform.terminate()
            const instance = platform.expose(SomeModule)
            expect(instance?.start_called).to.be.true
            expect(instance?.terminate_called).to.be.true
            expect(instance?.load_called).to.be.true
        })

        it('should record time after started and terminated', async function() {
            const platform = new Platform(load_config({}))
            platform.import(SomeModule)
            platform.import(SomeRoot)
            expect(platform.started_at).to.equal(-1)
            void platform.start(() => console.debug('started'))
            expect(platform.started_at).to.closeTo(Date.now(), 10)
            await platform.start()
            expect(platform.start_time).to.closeTo(Date.now() - platform.started_at, 50)
            expect(platform.terminated_at).to.equal(-1)
            void platform.terminate(() => console.debug('terminate'))
            expect(platform.terminated_at).to.closeTo(Date.now(), 10)
            await platform.terminate()
            expect(platform.terminate_time).to.closeTo(Date.now() - platform.terminated_at, 50)
            const instance = platform.expose(SomeModule)
            expect(instance?.start_called).to.be.true
            expect(instance?.terminate_called).to.be.true
            expect(instance?.load_called).to.be.true
        })

        it('should catch and ignore error in hooks', function() {
            const platform = new Platform(load_config({}))
            platform.import(SomeModule)
        })
    })
})
