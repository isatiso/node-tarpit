/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpRootLoader } from '../builtin/tp-root-loader'
import { Injector } from '../injector'
import { TpComponentCollection } from '../tp-component-type'
import { MetaTools } from './tp-meta-tools'

export type PluginSet = Set<TpPluginConstructor<any>>

export interface TpPlugin<K extends keyof TpComponentCollection> {

    load(meta: TpComponentCollection[K], injector: Injector): void

    start(): Promise<void>

    destroy(): Promise<void>
}

export interface TpPluginConstructor<K extends keyof TpComponentCollection> {
    new(...args: any[]): TpPlugin<K>
}

export const PluginSetToken = Symbol('œœ-PluginSet')

export function TpPluginType<K extends keyof TpComponentCollection>(options: {
    type: TpComponentCollection[K]['type']
    loader_list: TpComponentCollection[K]['loader'][]
    option_key?: K extends `Tp${infer M}` ? `${Lowercase<M>}s` : never
}): (constructor: TpPluginConstructor<K>) => void {
    return constructor => {
        MetaTools.default_plugin_meta(constructor.prototype)
            .do(meta => meta.type = options.type)
            .do(meta => meta.loader_list = options.loader_list)
            .do(meta => meta.option_key = options.option_key ?? '')
    }
}

export interface TpPluginCollection {
    TpRootLoader: typeof TpRootLoader
}

export type Plugins = TpPluginCollection[keyof TpPluginCollection]
