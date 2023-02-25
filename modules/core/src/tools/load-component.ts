/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpAssembly, TpComponent, TpEntry, TpRoot, TpWorker } from '../annotations'
import { TpLoader } from '../builtin/tp-loader'
import { ClassProvider, FactoryProvider, Injector, ValueProvider } from '../di'
import { ClassProviderDef, Constructor, FactoryProviderDef, Provider, ProviderDef, ProviderTreeNode, ValueProviderDef } from '../types'
import { get_class_decorator } from './decorator'
import { stringify } from './stringify'

function isClassProviderDef<T extends object>(def: ProviderDef<T> | Constructor<any>): def is ClassProviderDef<T> {
    return def.constructor.name === 'Object' && (def as any).useClass
}

function isFactoryProviderDef<T extends object>(def: ProviderDef<T> | Constructor<any>): def is FactoryProviderDef<T> {
    return def.constructor.name === 'Object' && (def as any).useFactory
}

function isValueProviderDef<T extends object>(def: ProviderDef<T> | Constructor<any>): def is ValueProviderDef<T> {
    return def.constructor.name === 'Object' && (def as any).useValue
}

export function def_to_provider(def: (ProviderDef<any> | Constructor<any>), injector: Injector): Provider<unknown> {
    if (isValueProviderDef(def)) {
        return ValueProvider.create(injector, def)
    }

    if (isFactoryProviderDef(def)) {
        return FactoryProvider.create(injector, def)
    }

    if (isClassProviderDef(def)) {
        const meta = get_class_decorator(def.useClass).find(d => d instanceof TpWorker)
        if (!meta) {
            throw new Error(`Property 'useClass' of ClassProviderDef must be a "TpWorker", received ${stringify(def.useClass)}.`)
        }
        return meta.provider = ClassProvider.create(injector, def)
    }

    const meta = get_class_decorator(def).find(d => d instanceof TpComponent)
    if (!meta) {
        throw new Error(`${stringify(def)} is not a "TpComponent".`)
    }

    load_component(meta, injector)
    return meta.provider
}

function collect_worker(meta: TpAssembly, injector: Injector): ProviderTreeNode {
    return {
        self: meta.cls,
        providers: meta.providers?.map(def => def_to_provider(def, injector)),
        children: meta.imports?.map(cls => load_component(get_class_decorator(cls).find(d => d instanceof TpAssembly), injector))
            .filter(data => data !== undefined)
    }
}

export function load_component(meta: any, injector: Injector): ProviderTreeNode | undefined {

    if (meta instanceof TpComponent) {

        injector = meta.inject_root ? injector.root : injector
        if (injector.has(meta.cls)) {
            return
        }

        // collect imports and providers
        const provider_tree = meta instanceof TpAssembly ? collect_worker(meta, injector) : undefined

        meta.provider = ClassProvider.create(injector, { provide: meta.cls, useClass: meta.cls })

        if (meta instanceof TpEntry) {
            meta.injector = injector
        }
        if (meta instanceof TpAssembly) {
            meta.instance = meta.provider.create()
        }
        if (meta instanceof TpRoot) {
            meta.entries?.map(p => get_class_decorator(p).find(d => d instanceof TpEntry))
                .filter(meta => meta)
                .forEach(meta => load_component(meta, injector))
        }
        if (meta.token) {
            injector.get(TpLoader)!.create().load(meta)
        }
        return provider_tree
    }
    return
}

export function check_usage(injector: Injector, tree_node: ProviderTreeNode | undefined, path?: any[]): boolean {
    path = path ?? []
    if (tree_node) {
        path = path.slice()
        path.push(tree_node.self)
        const providers_used = Boolean(tree_node.providers?.find(p => p.used))
        const children_used = tree_node.children?.map(node => check_usage(injector, node, path)).some(value => value)
        if (children_used || providers_used) {
            return true
        }
    }
    if (path.length) {
        injector.emit('unused-provider', path)
    }
    return false
}
