/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData } from '@tarpit/config'
import { Constructor } from '../__types__'
import { Injector } from '../injector'
import { TpComponentCollector } from './component-types'
import { MetaTools } from './meta-tools'

export type TpPluginConstructor<K extends keyof TpComponentCollector> = {
    new(injector: Injector, config_data: ConfigData): TpPlugin<K>
}

export interface TpPlugin<K extends keyof TpComponentCollector> {

    load(meta: TpComponentCollector[K], injector: Injector): void

    start(): Promise<void>

    destroy(): Promise<void>
}

export function TpPluginType<K extends keyof TpComponentCollector>(options: {
    type: TpComponentCollector[K]['type']
    loader_list: TpComponentCollector[K]['loader'][]
    option_key: K extends `Tp${infer M}` ? `${Lowercase<M>}s` : never
}): (constructor: Constructor<TpPlugin<K>>) => void {
    return constructor => {
        MetaTools.PluginMeta(constructor.prototype).ensure_default().do(origin_meta => {
            origin_meta.type = options.type
            origin_meta.loader_list = options.loader_list
            origin_meta.option_key = options.option_key
        })
    }
}
