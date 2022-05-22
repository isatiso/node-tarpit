/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Constructor, MetaTools, TpMeta } from '@tarpit/core'
import { get_router_unit, IGunslinger } from '../__tools__'
import { TpRouterMeta, TpRouterOptions } from '../__types__'

/**
 * 把一个类标记为 Tp.TpRouter，并配置元数据。
 *
 * @category Router Annotation
 */
export function TpRouter(path: `/${string}`, options?: TpRouterOptions): ClassDecorator {
    return (constructor: Function) => {
        const meta: TpMeta<TpRouterMeta | undefined> = MetaTools.ComponentMeta(constructor.prototype) as any
        if (meta.exist() && meta.value.type) {
            throw new Error(`Component ${meta.value.type} is exist -> ${meta.value.name}.`)
        }
        meta.set({
            type: 'TpRouter',
            loader: 'œœ-TpRouter',
            category: 'assembly',
            name: constructor.name,
            self: constructor as unknown as Constructor<any>,
            imports: options?.imports ?? [],
            providers: options?.providers ?? [],
            router_path: path,
            router_options: options,
            path_replacement: {},
        })

        const gunslinger: IGunslinger<any> = constructor as any

        gunslinger.mount = (new_path: `/${string}`) => {
            MetaTools.ensure_component_is(gunslinger, 'TpRouter')
                .do(meta => meta.router_path = new_path)
            return gunslinger
        }

        gunslinger.replace = (property_key: string, new_path: string) => {
            get_router_unit(gunslinger.prototype, property_key)
                .do(unit => {
                    if (unit) {
                        unit.path = new_path
                    } else {
                        console.log(`Warning: No TpRouterUnit exist at ${constructor.name}.${property_key}.`)
                    }
                })
            return gunslinger
        }
    }
}
