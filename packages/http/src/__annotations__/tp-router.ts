/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { collect_function, collect_provider, Constructor, DecoratorClass, load_component, Meta, TokenTools } from '@tarpit/core'
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
            loader: 'œœ-TpRouter',
            category: 'module',
            name: constructor.name,
            router_path: path,
            router_options: options,
            provider_collector: collect_provider(constructor, options),
            function_collector: () => collect_function<RouterFunction<any>>(constructor, 'TpRouterFunction'),
            on_load: (meta, injector) => load_component(constructor, injector, meta),
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
