/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { describe, expect, it } from 'vitest'
import { TpModule, TpRoot, TpService } from '../annotations'
import { TpLoader } from '../builtin/tp-loader'
import { ClassProvider, FactoryProvider, Injector, ValueProvider } from '../di'
import { get_class_decorator } from './decorator'
import { check_usage, load_component, load_provider_def_or_component } from './load-component'

describe('load-component.ts', () => {

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
            public _a2: DecoratedService2,
            public _a3: DecoratedService3,
        ) {
        }
    }

    @TpRoot({ imports: [DecoratedModule2, DecoratedModule3] })
    class DecoratedRootWithNoEntries {
        constructor(
            // private a1: DecoratedService1,
            public _a2: DecoratedService2,
            public _a3: DecoratedService3,
        ) {
        }
    }

    const injector = Injector.create()

    describe('#def_to_provider()', () => {
        it('should parse ProviderDef to Provider', () => {
            const provider1 = load_provider_def_or_component({ provide: Decorated, useClass: Decorated }, injector)
            expect(provider1).toBeInstanceOf(ClassProvider)
            expect(provider1?.create()).toBeInstanceOf(Decorated)
            expect(provider1?.create()).toEqual(provider1?.create())
            const provider2 = load_provider_def_or_component(Decorated, injector)
            expect(provider2).toBeInstanceOf(ClassProvider)
            expect(provider2?.create()).toBeInstanceOf(Decorated)
            expect(provider2?.create()).toEqual(provider2?.create())
            const provider3 = load_provider_def_or_component({ provide: Decorated, useFactory: () => new Decorated }, injector)
            expect(provider3).toBeInstanceOf(FactoryProvider)
            expect(provider3?.create()).toBeInstanceOf(Decorated)
            expect(provider3?.create()).not.toBe(provider3?.create())
            const provider4 = load_provider_def_or_component({ provide: 'Decorated', useValue: 'Decorated' }, injector)
            expect(provider4).toBeInstanceOf(ValueProvider)
            expect(provider4?.create()).toEqual('Decorated')

            expect(() => load_provider_def_or_component({ provide: 'Decorated', useValue: 'Decorated', multi: true }, injector)).toThrow()

            const provider5 = load_provider_def_or_component({ provide: 'Decorated multi', useValue: 'a', multi: true }, injector)
            const provider6 = load_provider_def_or_component({ provide: 'Decorated multi', useValue: 'b', multi: true }, injector)
            const provider7 = load_provider_def_or_component({ provide: 'Decorated multi', useValue: 'c', multi: true }, injector)
            expect(provider5).toBeInstanceOf(ValueProvider)
            expect(provider6).toEqual(provider5)
            expect(provider7).toEqual(provider5)
            expect(provider5?.create()).toEqual(['a', 'b', 'c'])
        })

        it('should throw error if given useClass of Constructor is not a TpWorker', () => {
            expect(() => load_provider_def_or_component({ provide: Decorated, useClass: NotDecorated }, injector))
                .toThrow('Property \'useClass\' of ClassProviderDef must be a "TpWorker", received NotDecorated')
            expect(() => load_provider_def_or_component(NotDecorated, injector)).toThrow('NotDecorated is not a "TpComponent"')
        })
    })

    describe('#load_component()', () => {

        function set_inner_loader(injector: Injector) {
            ClassProvider.create(injector, { provide: TpLoader, useClass: TpLoader })
        }

        it('should load TpService', () => {
            const temp_injector = Injector.create()
            set_inner_loader(temp_injector)
            const meta = get_class_decorator(DecoratedService1)?.find(d => d instanceof TpService)
            load_component(meta!, temp_injector)

            expect(temp_injector.get(DecoratedService1)).toBeInstanceOf(ClassProvider)
            expect(temp_injector.get(DecoratedService1)?.create()).toBeInstanceOf(DecoratedService1)
        })

        it('should load TpModule', () => {
            const temp_injector = Injector.create()
            set_inner_loader(temp_injector)
            const meta = get_class_decorator(DecoratedModule1)?.find(d => d instanceof TpModule)
            const tree_node = load_component(meta!, temp_injector)
            check_usage(temp_injector, tree_node!, [])

            expect(temp_injector.get(DecoratedModule1)).toBeInstanceOf(ClassProvider)
            expect(temp_injector.get(DecoratedModule1)?.create()).toBeInstanceOf(DecoratedModule1)

            expect(temp_injector.get(DecoratedService1)).toBeInstanceOf(ClassProvider)
            expect(temp_injector.get(DecoratedService1)?.create()).toBeInstanceOf(DecoratedService1)
        })

        it('should load TpRoot', () => {
            const temp_injector = Injector.create()
            const meta = get_class_decorator(DecoratedRoot)?.find(d => d instanceof TpRoot)
            load_component(meta!, temp_injector)
            const new_injector = meta!.injector

            expect(new_injector.get(DecoratedRoot)).toBeInstanceOf(ClassProvider)
            expect(temp_injector.get(DecoratedRoot)).toBeUndefined()
            expect(new_injector.get(DecoratedRoot)?.create()).toBeInstanceOf(DecoratedRoot)
            expect(meta!.provider?.create()).toBeInstanceOf(DecoratedRoot)

            expect(new_injector.get(DecoratedModule1)).toBeInstanceOf(ClassProvider)
            expect(temp_injector.get(DecoratedModule1)).toBeUndefined()
            expect(new_injector.get(DecoratedModule1)?.create()).toBeInstanceOf(DecoratedModule1)

            expect(new_injector.get(DecoratedService1)).toBeInstanceOf(ClassProvider)
            expect(temp_injector.get(DecoratedService1)).toBeUndefined()
            expect(new_injector.get(DecoratedService1)?.create()).toBeInstanceOf(DecoratedService1)

        })

        it('should do nothing if no entries provided in meta', () => {
            const temp_injector = Injector.create()
            const meta = get_class_decorator(DecoratedRootWithNoEntries)?.find(d => d instanceof TpRoot)
            load_component(meta!, temp_injector)
            expect(meta!.instance).toBeInstanceOf(DecoratedRootWithNoEntries)
        })

        it('should do nothing if meta is not TpComponent', () => {
            const temp_injector = Injector.create()
            load_component(null as any, temp_injector)
        })

        it('should search loader if token provided in meta', () => {
            const temp_injector = Injector.create()
            set_inner_loader(temp_injector)
            const meta = get_class_decorator(DecoratedRoot)?.find(d => d instanceof TpRoot)
            const tree_node = load_component(meta!, temp_injector)

            check_usage(temp_injector, tree_node!, [])
            check_usage(temp_injector, undefined, [])

            expect(meta!.instance).toBeInstanceOf(DecoratedRoot)
        })

        it('should search loader if token provided in meta, and throw error if load is not regular', () => {
            const temp_injector = Injector.create()
            set_inner_loader(temp_injector)
            const not_plugin_meta = get_class_decorator(Decorated)?.find(d => d instanceof TpService)
            ClassProvider.create(temp_injector, { provide: not_plugin_meta!.cls, useClass: not_plugin_meta!.cls })
            const meta = get_class_decorator(DecoratedRoot)?.find(d => d instanceof TpRoot)
            meta!.token = Symbol('tmp')
            expect(() => load_component(meta!, temp_injector)).toThrow('Can\'t find loader for component "DecoratedRoot"')
        })
    })
})
