/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Constructor, DecoratorClass, load_component, make_provider_collector, Meta, set_touched, TokenTools } from '@tarpit/core'
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
            name: constructor.name,
            router_path: path,
            router_options: options,
            provider_collector: make_provider_collector(constructor, 'TpRouter', options),
            on_load: (meta, injector) => load_component(constructor, injector, meta),
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
