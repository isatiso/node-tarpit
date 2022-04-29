/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { load_component, make_provider_collector, set_touched } from '../../collector'
import { IGunslinger } from '../../gunslinger'
import { TokenUtils } from '../../token-utils'
import { Constructor, DecoratorClass, RouterFunction, TpRouterOptions } from '../__types__'

/**
 * 把一个类标记为 Tp.TpRouter，并配置元数据。
 *
 * @category Router Annotation
 */
export function TpRouter(path: `/${string}`, options?: TpRouterOptions): DecoratorClass {
    return (constructor: Constructor<any> & IGunslinger<any>) => {
        const meta = TokenUtils.ComponentMeta(constructor.prototype)
        if (meta.exist() && meta.value.type) {
            throw new Error(`Component ${meta.value.type} is exist -> ${meta.value.name}.`)
        }
        meta.set({
            type: 'TpRouter',
            name: constructor.name,
            router_path: path,
            router_options: options,
            provider_collector: make_provider_collector(constructor, options),
            on_load: (meta, injector) => load_component(constructor, injector, meta, 'œœ-TpRouter'),
            function_collector: () => {
                const touched = set_touched(constructor).value
                return Object.values(touched)
                    .filter((item): item is RouterFunction<any> => item.type === 'TpRouterFunction')
            },
            path_replacement: {},
        })

        constructor.mount = (new_path: `/${string}`) => {
            TokenUtils.ensure_component(constructor, 'TpRouter').do(meta => {
                meta.router_path = new_path
            })
            return constructor
        }

        constructor.replace = (property_key: string, new_path: string) => {
            TokenUtils.RouterFunction(constructor.prototype, property_key).do(router_function => {
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
