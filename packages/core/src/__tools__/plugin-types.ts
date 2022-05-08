/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
    loader: TpComponentCollector[K]['loader']
    option_key: K extends `Tp${infer M}` ? `${Lowercase<M>}s` : never
}): (constructor: Constructor<TpPlugin<K>>) => void {
    return constructor => {
        MetaTools.PluginMeta(constructor.prototype).ensure_default().do(origin_meta => {
            origin_meta.type = options.type
            origin_meta.loader = options.loader
            origin_meta.option_key = options.option_key
        })
    }
}
