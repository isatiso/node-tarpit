/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Constructor, Provider, ProviderDef, ProviderTreeNode } from '../__types__'
import { Injector } from '../injector'
import { ClassProvider, def2Provider } from '../provider'
import { BasePropertyFunction, ImportsAndProviders, TpComponentMeta } from './component-types'
import { MetaTools } from './meta-tools'
import { TokenTools } from './token-tools'

/**
 * @private
 *
 * 遍历依赖加载树，查找没有被使用的 Tp.TpModule。
 *
 * @param tree_node
 * @param indent
 */
export function _find_usage(tree_node: ProviderTreeNode | undefined, indent: number = 0): boolean {
    return Boolean(tree_node?.providers?.find(p => p?.used)
        || tree_node?.children?.find(t => _find_usage(t, indent + 1)))
}

export function get_providers(desc: BasePropertyFunction<any>, injector: Injector, except_list?: any[]): Provider<any>[] {
    return desc.param_types?.map((token: any, i: number) => {
        if (token === undefined) {
            throw new Error(`type 'undefined' at ${desc.pos}[${i}], if it's not specified, there maybe a circular import.`)
        }
        if (except_list?.includes(token)) {
            return token
        }
        const provider = injector.get(token, desc.pos)
        if (provider) {
            provider.create()
            return provider
        }
        throw new Error(`Can't find provider of "${token}" in [${desc.pos}, args[${i}]]`)
    }) ?? []
}

export function load_component(constructor: Constructor<any>, injector: Injector, meta: TpComponentMeta): ProviderTreeNode | undefined {

    if (!injector.has(constructor)) {
        const provider_tree: ProviderTreeNode | undefined = meta.category === 'module' ? meta.provider_collector?.(injector) : undefined

        injector.set_provider(constructor, new ClassProvider(constructor, injector))
        meta.provider = injector.get(constructor)!
        TokenTools.Instance(constructor).set(meta.provider.create())

        const token = injector.get<any>(meta.loader)?.create()
        if (token) {
            injector.get<any>(token)?.create().load(meta, injector)
        }

        return provider_tree
    }
}

export function check_used(provider_tree: ProviderTreeNode | undefined, constructor: Constructor<any>) {
    provider_tree?.children.filter(def => !_find_usage(def))
        .forEach(def => {
            console.log(`Warning: ${constructor.name} -> ${def?.name} not used.`)
        })
}

export function set_touched(constructor: Constructor<any>) {
    return TokenTools.Touched(constructor.prototype)
        .ensure_default()
        .do((touched: Record<string, BasePropertyFunction<any>>) => Object.values(touched).forEach(item => {
            item.meta = MetaTools.PropertyMeta(constructor.prototype, item.property).value
            item.pos = `${constructor.name}.${item.property}`
            item.handler = item.handler.bind(TokenTools.Instance(constructor).value)
        }))
}

export function make_provider_collector(constructor: Constructor<any>, options?: ImportsAndProviders): (injector: Injector) => ProviderTreeNode {
    return function(injector: Injector) {
        const children = options?.imports?.map(md => {
            const module_meta = TokenTools.ensure_component(md).value
            if (module_meta.category !== 'module') {
                throw new Error(`${module_meta.name} is "${module_meta.type}" which should be a "TpModuleLike".`)
            }
            return module_meta.provider_collector(injector)
        }) ?? []

        // TODO:
        // options?.producers?.forEach(m => {
        //     const meta = TokenTools.ensure_component(m, 'TpProducer').value
        //     meta.on_load(meta, injector)
        // })

        const providers: (Provider<any> | undefined)[] = [
            ...def2Provider([...options?.providers ?? []] as (ProviderDef<any> | Constructor<any>)[], injector) ?? []
        ]

        return { name: constructor.name, providers, children }
    }
}
