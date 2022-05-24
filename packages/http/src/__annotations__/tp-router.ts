/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Constructor, MetaTools } from '@tarpit/core'
import { IGunslinger, RouterUnit } from '../__tools__'
import { TpRouterMeta, TpRouterOptions } from '../__types__'

/**
 * 把一个类标记为 Tp.TpRouter，并配置元数据。
 *
 * @category Router Annotation
 */
export function TpRouter(path: `/${string}`, options?: TpRouterOptions): ClassDecorator {
    return constructor => {
        MetaTools.ComponentMeta(constructor.prototype)
            .if_exist(meta => {
                throw new Error(`Component ${meta.type} is exist -> ${meta.name}.`)
            })
            .set<TpRouterMeta>({
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
            RouterUnit(gunslinger.prototype, property_key)
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
