/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Constructor, Provider, ProviderDef, ProviderTreeNode } from '../__types__'
import { Injector } from '../injector'
import { ClassProvider, FactoryProvider, ValueProvider } from '../provider'
import { TpUnitCollection, TpUnitCommon } from '../tp-component-type'
import { MetaTools } from './tp-meta-tools'

function _find_usage(tree_node: ProviderTreeNode | undefined, indent: number = 0): boolean {
    return Boolean(tree_node?.providers?.find(p => p?.used)
        || tree_node?.children?.find(t => _find_usage(t, indent + 1)))
}

export function check_used(provider_tree: ProviderTreeNode | undefined, name: string) {
    provider_tree?.children.filter(def => !_find_usage(def))
        .forEach(def => console.log(`Warning: ${name} -> ${def?.name} not used.`))
}

export function get_providers(desc: TpUnitCommon<any>, injector: Injector, except_list?: any[]): Provider<any>[] {
    return desc.param_types?.map((token: any, i: number) => {
        if (token === undefined) {
            console.error(`type 'undefined' at ${desc.pos}[${i}], if it's not specified, there maybe a circular import.`)
        }
        if (except_list?.includes(token)) {
            return token
        }
        const provider = injector.get(token, desc.pos)
        if (!provider) {
            throw new Error(`Can't find provider of "${token}" in [${desc.pos}, args[${i}]]`)
        }
        provider.create()
        return provider
    }) ?? []
}

export function load_component(constructor: Constructor<any>, injector: Injector): ProviderTreeNode | undefined {

    if (!injector.has(constructor)) {
        const meta = MetaTools.ensure_component(constructor).value
        const provider_tree = meta.category === 'assembly' ? collect_worker(constructor, injector) : undefined
        meta.provider = injector.set_provider(constructor, new ClassProvider(constructor, injector))
        MetaTools.Instance(constructor).set(meta.provider.create())

        const token = meta.loader && injector.get<any>(meta.loader)?.create()
        if (!token) {
            meta.provider = injector.set_provider(constructor, new ClassProvider(constructor as any, injector))
        } else {
            injector.get<any>(token)?.create().load(meta, injector)
        }

        check_used(provider_tree, constructor.name)

        return provider_tree
    }
}

export function collect_unit<T extends keyof TpUnitCollection>(constructor: Constructor<any>, type: T) {
    const record = MetaTools.UnitRecord(constructor.prototype)
        .ensure_default()
        .do(touched => touched.forEach(item => {

            item.meta = MetaTools.PropertyMeta(constructor.prototype, item.property).value
            item.pos = `${constructor.name}.${item.property.toString()}`
            item.handler = item.handler.bind(MetaTools.Instance(constructor).value)

        }))
    return Object.values(record.value).filter((item): item is TpUnitCollection[T] => item.type === type)
}

export function collect_worker(constructor: Function, injector: Injector): ProviderTreeNode {
    const meta = MetaTools.ensure_assembly(constructor).value
    return {
        name: constructor.name,
        providers: [...def2Provider([...meta.providers], injector)],
        children: meta.imports.map(item => collect_worker(item, injector)) ?? []
    }
}

/**
 * @private
 *
 * Provider 定义解析函数。
 *
 * @param defs
 * @param injector
 */
export function def2Provider(defs: (ProviderDef<any> | Constructor<any>)[], injector: Injector): (Provider<unknown> | undefined)[] {
    return defs?.map(def => {

        const token = (def as any).provide ?? def
        if (injector.local_has(token)) {
            return injector.get(token)
        }

        if (ValueProvider.isValueProviderDef(def)) {
            return injector.set_provider(def.provide, new ValueProvider('valueProvider', def.useValue))

        } else if (FactoryProvider.isFactoryProviderDef(def)) {
            return injector.set_provider(def.provide, new FactoryProvider('FactoryProvider', def.useFactory as any, def.deps))

        } else if (ClassProvider.isClassProviderDef(def)) {
            const meta = MetaTools.ensure_worker(def.useClass).value
            return meta.provider = injector.set_provider(def, new ClassProvider(def.useClass, injector))

        } else {
            const meta = MetaTools.ensure_worker(def).value
            load_component(meta.self, injector)
            return meta.provider
        }
    }) ?? []
}
