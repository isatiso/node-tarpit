/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Constructor, Provider, ProviderDef, ProviderTreeNode } from '../__types__'
import { Injector } from '../injector'
import { ClassProvider, def2Provider } from '../provider'
import { BasePropertyFunction, ImportsAndProviders, TpComponentMeta } from './component-types'
import { MetaTools } from './meta-tools'
import { TokenTools } from './token-tools'

function _find_usage(tree_node: ProviderTreeNode | undefined, indent: number = 0): boolean {
    return Boolean(tree_node?.providers?.find(p => p?.used)
        || tree_node?.children?.find(t => _find_usage(t, indent + 1)))
}

export function check_used(provider_tree: ProviderTreeNode | undefined, name: string) {
    provider_tree?.children.filter(def => !_find_usage(def))
        .forEach(def => console.log(`Warning: ${name} -> ${def?.name} not used.`))
}

export function get_providers(desc: BasePropertyFunction<any>, injector: Injector, except_list?: any[]): Provider<any>[] {
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

export function load_component(constructor: Constructor<any>, injector: Injector, meta: TpComponentMeta): ProviderTreeNode | undefined {

    if (!injector.has(constructor)) {
        const provider_tree: ProviderTreeNode | undefined =
            meta.category === 'module'
                ? meta.provider_collector?.(injector)
                : undefined

        meta.provider = injector.set_provider(constructor, new ClassProvider(constructor, injector))
        TokenTools.Instance(constructor).set(meta.provider.create())

        const token = injector.get<any>(meta.loader)?.create()
        if (token) {
            injector.get<any>(token)?.create().load(meta, injector)
        }

        provider_tree?.children.filter(def => !_find_usage(def))
            .forEach(def => console.log(`Warning: ${name} -> ${def?.name} not used.`))

        check_used(provider_tree, constructor.name)

        return provider_tree
    }
}

export function collect_function<T extends BasePropertyFunction<any>>(constructor: Constructor<any>, type: T['type']) {
    const record = TokenTools.FunctionRecord(constructor.prototype)
        .ensure_default()
        .do((touched: Record<string, BasePropertyFunction<any>>) => Object.values(touched).forEach(item => {
            item.meta = MetaTools.PropertyMeta(constructor.prototype, item.property).value
            item.pos = `${constructor.name}.${item.property}`
            item.handler = item.handler.bind(TokenTools.Instance(constructor).value)
        }))
    return Object.values(record.value).filter((item): item is T => item.type === type)
}

export function collect_provider(constructor: Constructor<any>, options?: ImportsAndProviders): (injector: Injector) => ProviderTreeNode {
    return function(injector: Injector) {
        const children = options?.imports?.map(md => {
            const module_meta = TokenTools.ensure_component(md).value
            if (module_meta.category !== 'module') {
                throw new Error(`${module_meta.name} is "${module_meta.type}" which should be a "TpModuleLike".`)
            }
            return module_meta.provider_collector(injector)
        }) ?? []

        const providers: (Provider<any> | undefined)[] = [
            ...def2Provider([...options?.providers ?? []] as (ProviderDef<any> | Constructor<any>)[], injector) ?? []
        ]

        return { name: constructor.name, providers, children }
    }
}
