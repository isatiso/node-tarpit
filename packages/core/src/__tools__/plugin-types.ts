/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ConfigData } from '@tarpit/config'
import { Injector } from '../injector'
import { TpComponentCollector } from './component-types'

export interface TpPluginConstructor<K extends keyof TpComponentCollector> {
    new(injector: Injector, config_data: ConfigData): TpPlugin<K>
}



export interface TpPlugin<K extends keyof TpComponentCollector> {

    load<T extends TpComponentCollector[K]>(meta: T, injector: Injector): void

    start(): Promise<void>

    destroy(): Promise<void>
}
