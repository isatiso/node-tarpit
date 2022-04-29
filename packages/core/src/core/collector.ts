/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Authenticator } from '../service/authenticator'
import { CacheProxy } from '../service/cache-proxy'
import { LifeCycle } from '../service/life-cycle'
import { ResultWrapper } from '../service/result-wrapper'
import { Constructor, ImportsAndProviders, PropertyFunction, ProviderTreeNode, TpConsumerMeta, TpProducerMeta, TpRouterMeta, TpTriggerMeta } from './annotation'
import { Injector } from './injector'
import { ClassProvider, def2Provider, Provider, ProviderDef } from './provider'
import { TokenUtils } from './token-utils'

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

export function get_providers(desc: PropertyFunction<any>, injector: Injector, except_list?: any[]): Provider<any>[] {
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

export function load_component(constructor: Constructor<any>, injector: Injector, meta: TpRouterMeta, loader: 'œœ-TpRouter'): void
export function load_component(constructor: Constructor<any>, injector: Injector, meta: TpTriggerMeta, loader: 'œœ-TpTrigger'): void
export function load_component(constructor: Constructor<any>, injector: Injector, meta: TpConsumerMeta, loader: 'œœ-TpConsumer'): void
export function load_component(constructor: Constructor<any>, injector: Injector, meta: TpProducerMeta, loader: 'œœ-TpProducer'): void
export function load_component(constructor: Constructor<any>, injector: Injector, meta: any, loader: string) {

    if (!injector.has(constructor)) {
        const provider_tree: ProviderTreeNode = meta.provider_collector?.(injector)

        if (loader === 'œœ-TpRouter') {
            injector.get(Authenticator)?.set_used()
            injector.get(LifeCycle)?.set_used()
            injector.get(CacheProxy)?.set_used()
            injector.get(ResultWrapper)?.set_used()
        }

        injector.set_provider(constructor, new ClassProvider(constructor, injector))
        meta.provider = injector.get(constructor)!
        TokenUtils.Instance(constructor).set(meta.provider.create())

        const token = injector.get<any>(loader)?.create()
        if (token) {
            injector.get<any>(token)?.create().load(meta, injector)
        }

        provider_tree?.children.filter(def => !_find_usage(def))
            .forEach(def => {
                console.log(`Warning: ${constructor.name} -> ${def?.name} not used.`)
            })
    }
}

export function set_touched(constructor: Constructor<any>) {
    return TokenUtils.Touched(constructor.prototype)
        .ensure_default()
        .do((touched: Record<string, PropertyFunction<any>>) => Object.values(touched).forEach(item => {
            item.meta = TokenUtils.PropertyMeta(constructor.prototype, item.property).value
            item.pos = `${constructor.name}.${item.property}`
            item.handler = item.handler.bind(TokenUtils.Instance(constructor).value)
        }))
}

export function make_provider_collector(constructor: Constructor<any>, options?: ImportsAndProviders): (injector: Injector) => ProviderTreeNode {
    return function(injector: Injector) {
        const children = options?.imports?.map(md => {
            const module_meta = TokenUtils.ensure_component(md, 'TpModuleLike').value
            return module_meta.provider_collector(injector)
        }) ?? []

        options?.producers?.forEach(m => {
            const meta = TokenUtils.ensure_component(m, 'TpProducer').value
            meta.on_load(meta, injector)
        })

        const providers: (Provider<any> | undefined)[] = [
            ...def2Provider([...options?.providers ?? []] as (ProviderDef<any> | Constructor<any>)[], injector) ?? []
        ]

        return { name: constructor.name, providers, children }
    }
}
