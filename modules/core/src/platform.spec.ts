/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { Debug, TpEntry, TpModule, TpRoot, TpService, TpUnit } from './annotations'
import { TpInspector } from './builtin/tp-inspector'
import { TpLoader } from './builtin/tp-loader'
import { Injector } from './di'
import { Platform } from './platform'
import { get_class_decorator, make_decorator } from './tools/decorator'

chai.use(cap)

describe('platform.ts', function() {

    @Debug()
    class Noop {
    }

    @TpService()
    class Service1 {
    }

    @TpModule({ providers: [Service1] })
    class Module1 {
    }

    @TpRoot({ imports: [Module1], entries: [Root1] })
    class Root1 {
    }

    describe('Platform', function() {
        it('could create instance by new operator', function() {
            expect(() => new Platform({})).to.not.throw()
        })
    })

    describe('Platform#import()', function() {
        it('should import ClassProviderDef to Platform', function() {
            const platform = new Platform({})
            platform.import({ provide: Service1, useClass: Service1 })
            expect((platform as any).root_injector.get(Service1)?.create()).to.be.instanceof(Service1)
        })

        it('should import FactoryProviderDef to Platform', function() {
            const platform = new Platform({})
            platform.import({ provide: Service1, useFactory: () => new Service1() })
            expect((platform as any).root_injector.get(Service1)?.create()).to.be.instanceof(Service1)
        })

        it('should import ValueProviderDef to Platform', function() {
            const platform = new Platform({})
            platform.import({ provide: Service1, useValue: Service1 })
            expect((platform as any).root_injector.get(Service1)?.create()).to.equal(Service1)
        })

        it('should import TpService to Platform', function() {
            const platform = new Platform({})
            platform.import(Service1)
            expect((platform as any).root_injector.get(Service1)?.create()).to.be.instanceof(Service1)
        })

        it('should import TpModule to Platform', function() {
            const platform = new Platform({})
            platform.import(Module1)
            expect((platform as any).root_injector.get(Module1)?.create()).to.be.instanceof(Module1)
        })

        it('should import TpRoot to Platform', function() {
            const platform = new Platform({})
            platform.import(Root1)
            expect((platform as any).root_injector.get(Root1)?.create()).to.be.instanceof(Root1)
        })
    })

    describe('Platform#bootstrap()', function() {
        it('should bootstrap TpRoot to Platform', function() {
            const platform = new Platform({})
            platform.bootstrap(Root1)
            const meta = get_class_decorator(Root1)?.find(d => d instanceof TpEntry)

            expect(meta.injector!.get(Root1)?.create()).to.be.instanceof(Root1)
            expect(meta.injector!.get(Module1)?.create()).to.be.instanceof(Module1)
            expect(meta.injector!.get(Service1)?.create()).to.be.instanceof(Service1)
        })

        it('should throw error if provided is not "TpEntry"', function() {
            const platform = new Platform({})
            expect(() => platform.bootstrap(Noop)).to.throw('Noop is not a "TpEntry"')
        })
    })

    describe('Platform#expose()', function() {
        it('should expose things from root injector', function() {
            const platform = new Platform({})
            const inspector = platform.expose(TpInspector)
            expect(inspector).to.be.instanceof(TpInspector)
        })

        it('should expose undefined from provided not exists', function() {
            const platform = new Platform({})
            const inspector = platform.expose(Noop)
            expect(inspector).to.be.undefined
        })
    })

    describe('Platform start && terminate', function() {

        const some_module_token = Symbol.for('œœ.token.SomeModule')

        const SomeDecorator = make_decorator('SomeDecorator', () => ({ token: some_module_token }), TpEntry)
        const SomeUnit = make_decorator('SomeUnit', () => ({}), TpUnit)

        @SomeDecorator()
        class SomeEntry {
            @SomeUnit()
            prop() {
            }
        }

        @TpModule()
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
            entries: [SomeEntry]
        })
        class SomeRoot {

        }

        it('should call all hooks', async function() {
            const platform = new Platform({})
            platform.import(SomeModule)
            platform.bootstrap(SomeRoot)
            const inspector = platform.expose(TpInspector)
            platform.start()
            platform.start()
            await inspector?.wait_start()
            platform.terminate()
            platform.terminate()
            await inspector?.wait_terminate()
            const instance = platform.expose(SomeModule)
            expect(instance?.start_called).to.be.true
            expect(instance?.terminate_called).to.be.true
            expect(instance?.load_called).to.be.true
        })

        it('should catch and ignore error in hooks', function() {
            const platform = new Platform({})
            platform.import(SomeModule)
        })
    })
})
