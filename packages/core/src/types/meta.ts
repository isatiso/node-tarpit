/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Provider } from './provider'

export interface ParamDepsMeta {
    token: any
    optional: boolean
}

export interface ParamInjection {
    param_deps: ParamDepsMeta[]
    providers?: Array<Provider<unknown> | null>
}

export interface ClassMeta extends ParamInjection {
    on_destroy?: TypedPropertyDescriptor<any>
}

export interface PropertyMeta extends ParamInjection {
    disabled?: boolean
    worker?: { channel: string }
}

export interface PluginMeta {
    type: string
    loader_list: string[]
    option_key: string
}
