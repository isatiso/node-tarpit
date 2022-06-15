/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpAssembly, TpComponent, TpEntry, TpPluginType, TpWorker } from '../../annotations'
import { ClassProvider, FactoryProvider, Injector, ValueProvider } from '../../di'
import { ClassProviderDef, Constructor, FactoryProviderDef, Provider, ProviderDef, ProviderTreeNode, ValueProviderDef } from '../../types'
import { stringify } from '../stringify'
import { get_class_decorator } from '../tp-decorator'

function isClassProviderDef<T extends object>(def: ProviderDef<T> | Constructor<any>): def is ClassProviderDef<T> {
    return def.constructor.name === 'Object' && (def as any).useClass
}

function isFactoryProviderDef<T extends object>(def: ProviderDef<T> | Constructor<any>): def is FactoryProviderDef<T> {
    return def.constructor.name === 'Object' && (def as any).useFactory
}

function isValueProviderDef<T extends object>(def: ProviderDef<T> | Constructor<any>): def is ValueProviderDef<T> {
    return def.constructor.name === 'Object' && (def as any).useValue
}

export function def_to_provider(def: (ProviderDef<any> | Constructor<any>), injector: Injector): Provider<unknown> | undefined {
    if (isValueProviderDef(def)) {
        return ValueProvider.create(injector, def.provide, def.useValue)

    } else if (isFactoryProviderDef(def)) {
        return FactoryProvider.create(injector, def.provide, def.useFactory, def.deps)

    }
    const cls = isClassProviderDef(def) ? def.useClass : def
    const meta = get_class_decorator(cls)?.find(d => d instanceof TpWorker)
    if (!meta) {
        throw new Error(`${stringify(cls)} is not a known type of provider definition or "TpWorker".`)
    }

    if (isClassProviderDef(def)) {
        return meta.provider = ClassProvider.create(injector, def.provide, def.useClass)
    } else {
        load_component(meta, injector)
        return meta.provider
    }
}

function _find_usage(tree_node: ProviderTreeNode | undefined, indent: number = 0): boolean {
    return Boolean(tree_node?.providers?.find(p => p?.used)
        || tree_node?.children?.find(t => _find_usage(t, indent + 1)))
}

export function collect_worker(meta: TpAssembly, injector: Injector): ProviderTreeNode {
    return {
        name: meta.cls.name,
        providers: meta.providers?.map(def => def_to_provider(def, injector)),
        children: meta.imports?.map(cls => get_class_decorator(cls))
            .map(list => list?.find((sub_meta): sub_meta is TpAssembly => sub_meta instanceof TpAssembly))
            .filter((sub_meta): sub_meta is TpAssembly => !!sub_meta)
            .map(sub_meta => collect_worker(sub_meta, injector)),
    }
}

export function load_component(meta: any, injector: Injector) {

    if (meta instanceof TpComponent && !injector.has(meta.cls)) {
        // collect imports and providers
        const provider_tree = meta instanceof TpAssembly ? collect_worker(meta, injector) : undefined
        provider_tree?.children?.filter(def => !_find_usage(def))
            .forEach(def => console.log(`Warning: ${meta.cls.name} -> ${def?.name} not used.`))

        meta.provider = ClassProvider.create(injector, meta.cls, meta.cls)

        if (meta.token) {
            const loader = injector.get<TpPluginType>(meta.token)?.create()
            if (loader) {
                if (!loader.load || typeof loader.load !== 'function') {
                    throw new Error(`Can't find loader for component "${meta.cls.name}"`)
                }
                if (meta instanceof TpEntry) {
                    meta.instance = meta.provider?.create()
                }
                loader.load(meta, injector)
            }
        }
    }
}
