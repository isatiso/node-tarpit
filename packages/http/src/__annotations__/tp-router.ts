/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { check_used, Constructor, DecoratorClass, load_component, make_provider_collector, Meta, set_touched, TokenTools } from '@tarpit/core'
import { Authenticator } from '../__services__/authenticator'
import { CacheProxy } from '../__services__/cache-proxy'
import { LifeCycle } from '../__services__/life-cycle'
import { ResultWrapper } from '../__services__/result-wrapper'
import { get_router_function, IGunslinger } from '../__tools__'
import { RouterFunction, TpRouterMeta, TpRouterOptions } from '../__types__'

/**
 * 把一个类标记为 Tp.TpRouter，并配置元数据。
 *
 * @category Router Annotation
 */
export function TpRouter(path: `/${string}`, options?: TpRouterOptions): DecoratorClass {
    return (constructor: Constructor<any> & IGunslinger<any>) => {
        const meta: Meta<TpRouterMeta | undefined> = TokenTools.ComponentMeta(constructor.prototype) as any
        if (meta.exist() && meta.value.type) {
            throw new Error(`Component ${meta.value.type} is exist -> ${meta.value.name}.`)
        }
        meta.set({
            type: 'TpRouter',
            loader: '∑∫πœ-TpRouter',
            category: 'module',
            name: constructor.name,
            router_path: path,
            router_options: options,
            provider_collector: make_provider_collector(constructor, options),
            on_load: (meta, injector) => {
                const provider_tree = load_component(constructor, injector, meta)
                injector.get(Authenticator)?.set_used()
                injector.get(LifeCycle)?.set_used()
                injector.get(CacheProxy)?.set_used()
                injector.get(ResultWrapper)?.set_used()
                check_used(provider_tree, constructor)
            },
            function_collector: () => {
                const touched = set_touched(constructor).value
                return Object.values(touched)
                    .filter((item): item is RouterFunction<any> => item.type === 'TpRouterFunction')
            },
            path_replacement: {},
        })

        constructor.mount = (new_path: `/${string}`) => {
            TokenTools.ensure_component_is(constructor, 'TpRouter').do(meta => {
                meta.router_path = new_path
            })
            return constructor
        }

        constructor.replace = (property_key: string, new_path: string) => {
            get_router_function(constructor.prototype, property_key).do(router_function => {
                if (router_function) {
                    router_function.path = new_path
                } else {
                    console.log(`Warning: No RouterFunction exist at ${constructor.name}.${property_key}.`)
                }
            })
            return constructor
        }
    }
}
