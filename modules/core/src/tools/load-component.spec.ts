/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { TpModule, TpRoot, TpService } from '../annotations'
import { TpLoader } from '../builtin/tp-loader'
import { ClassProvider, FactoryProvider, Injector, ValueProvider } from '../di'
import { get_class_decorator } from './decorator'
import { check_usage, load_component, load_provider_def_or_component } from './load-component'

chai.use(cap)

describe('load-component.ts', function() {

    @TpService({ inject_root: true })
    class Decorated {
    }

    class NotDecorated {
    }

    @TpService()
    class DecoratedService1 {
    }

    @TpService()
    class DecoratedService2 {
    }

    @TpService()
    class DecoratedService3 {

    }

    @TpModule({ providers: [DecoratedService1] })
    class DecoratedModule1 {
    }

    @TpModule({ imports: [DecoratedModule1], providers: [DecoratedService2, DecoratedService3] })
    class DecoratedModule2 {
    }

    @TpModule({})
    class DecoratedModule3 {
    }

    @TpRoot({ imports: [DecoratedModule2, DecoratedModule3], entries: [DecoratedService1, DecoratedModule1, DecoratedRoot] })
    class DecoratedRoot {
        constructor(
            // private a1: DecoratedService1,
            private _a2: DecoratedService2,
            private _a3: DecoratedService3,
        ) {
        }
    }

    @TpRoot({ imports: [DecoratedModule2, DecoratedModule3] })
    class DecoratedRootWithNoEntries {
        constructor(
            // private a1: DecoratedService1,
            private _a2: DecoratedService2,
            private _a3: DecoratedService3,
        ) {
        }
    }

    const injector = Injector.create()

    describe('#def_to_provider()', function() {
        it('should parse ProviderDef to Provider', function() {
            const provider1 = load_provider_def_or_component({ provide: Decorated, useClass: Decorated }, injector)
            expect(provider1).to.be.instanceof(ClassProvider)
            expect(provider1?.create()).to.be.instanceof(Decorated)
            expect(provider1?.create()).to.equal(provider1?.create())
            const provider2 = load_provider_def_or_component(Decorated, injector)
            expect(provider2).to.be.instanceof(ClassProvider)
            expect(provider2?.create()).to.be.instanceof(Decorated)
            expect(provider2?.create()).to.equal(provider2?.create())
            const provider3 = load_provider_def_or_component({ provide: Decorated, useFactory: () => new Decorated }, injector)
            expect(provider3).to.be.instanceof(FactoryProvider)
            expect(provider3?.create()).to.be.instanceof(Decorated)
            expect(provider3?.create()).to.not.equal(provider3?.create())
            const provider4 = load_provider_def_or_component({ provide: 'Decorated', useValue: 'Decorated' }, injector)
            expect(provider4).to.be.instanceof(ValueProvider)
            expect(provider4?.create()).to.equal('Decorated')

            expect(() => load_provider_def_or_component({ provide: 'Decorated', useValue: 'Decorated', multi: true }, injector)).to.throw()

            const provider5 = load_provider_def_or_component({ provide: 'Decorated multi', useValue: 'a', multi: true }, injector)
            const provider6 = load_provider_def_or_component({ provide: 'Decorated multi', useValue: 'b', multi: true }, injector)
            const provider7 = load_provider_def_or_component({ provide: 'Decorated multi', useValue: 'c', multi: true }, injector)
            expect(provider5).to.be.instanceof(ValueProvider)
            expect(provider6).to.equal(provider5)
            expect(provider7).to.equal(provider5)
            expect(provider5?.create()).to.eql(['a', 'b', 'c'])
        })

        it('should throw error if given useClass of Constructor is not a TpWorker', function() {
            expect(() => load_provider_def_or_component({ provide: Decorated, useClass: NotDecorated }, injector))
                .to.throw('Property \'useClass\' of ClassProviderDef must be a "TpWorker", received NotDecorated')
            expect(() => load_provider_def_or_component(NotDecorated, injector)).to.throw('NotDecorated is not a "TpComponent"')
        })
    })

    describe('#load_component()', function() {

        function set_inner_loader(injector: Injector) {
            ClassProvider.create(injector, { provide: TpLoader, useClass: TpLoader })
        }

        it('should load TpService', function() {
            const temp_injector = Injector.create()
            set_inner_loader(temp_injector)
            const meta = get_class_decorator(DecoratedService1)?.find(d => d instanceof TpService)
            load_component(meta, temp_injector)

            expect(temp_injector.get(DecoratedService1)).to.be.instanceof(ClassProvider)
            expect(temp_injector.get(DecoratedService1)?.create()).to.be.instanceof(DecoratedService1)
        })

        it('should load TpModule', function() {
            const temp_injector = Injector.create()
            set_inner_loader(temp_injector)
            const meta = get_class_decorator(DecoratedModule1)?.find(d => d instanceof TpModule)
            const tree_node = load_component(meta, temp_injector)
            check_usage(temp_injector, tree_node, [])

            expect(temp_injector.get(DecoratedModule1)).to.be.instanceof(ClassProvider)
            expect(temp_injector.get(DecoratedModule1)?.create()).to.be.instanceof(DecoratedModule1)

            expect(temp_injector.get(DecoratedService1)).to.be.instanceof(ClassProvider)
            expect(temp_injector.get(DecoratedService1)?.create()).to.be.instanceof(DecoratedService1)
        })

        it('should load TpRoot', function() {
            const temp_injector = Injector.create()
            const meta = get_class_decorator(DecoratedRoot)?.find(d => d instanceof TpRoot)
            load_component(meta, temp_injector)
            const new_injector = meta.injector

            expect(new_injector.get(DecoratedRoot)).to.be.instanceof(ClassProvider)
            expect(temp_injector.get(DecoratedRoot)).to.be.undefined
            expect(new_injector.get(DecoratedRoot)?.create()).to.be.instanceof(DecoratedRoot)
            expect(meta.provider?.create()).to.be.instanceof(DecoratedRoot)

            expect(new_injector.get(DecoratedModule1)).to.be.instanceof(ClassProvider)
            expect(temp_injector.get(DecoratedModule1)).to.be.undefined
            expect(new_injector.get(DecoratedModule1)?.create()).to.be.instanceof(DecoratedModule1)

            expect(new_injector.get(DecoratedService1)).to.be.instanceof(ClassProvider)
            expect(temp_injector.get(DecoratedService1)).to.be.undefined
            expect(new_injector.get(DecoratedService1)?.create()).to.be.instanceof(DecoratedService1)

        })

        it('should do nothing if no entries provided in meta', function() {
            const temp_injector = Injector.create()
            const meta = get_class_decorator(DecoratedRootWithNoEntries)?.find(d => d instanceof TpRoot)
            load_component(meta, temp_injector)
            expect(meta.instance).to.be.instanceof(DecoratedRootWithNoEntries)
        })

        it('should do nothing if meta is not TpComponent', function() {
            const temp_injector = Injector.create()
            load_component(null as any, temp_injector)
        })

        it('should search loader if token provided in meta', function() {
            const temp_injector = Injector.create()
            set_inner_loader(temp_injector)
            const meta = get_class_decorator(DecoratedRoot)?.find(d => d instanceof TpRoot)
            const tree_node = load_component(meta, temp_injector)

            check_usage(temp_injector, tree_node, [])
            check_usage(temp_injector, undefined, [])

            expect(meta.instance).to.be.instanceof(DecoratedRoot)
        })

        it('should search loader if token provided in meta, and throw error if load is not regular', function() {
            const temp_injector = Injector.create()
            set_inner_loader(temp_injector)
            const not_plugin_meta = get_class_decorator(Decorated)?.find(d => d instanceof TpService)
            ClassProvider.create(temp_injector, { provide: not_plugin_meta!.cls, useClass: not_plugin_meta!.cls })
            const meta = get_class_decorator(DecoratedRoot)?.find(d => d instanceof TpRoot)
            meta.token = Symbol('tmp')
            expect(() => load_component(meta, temp_injector)).to.throw('Can\'t find loader for component "DecoratedRoot"')
        })
    })
})
