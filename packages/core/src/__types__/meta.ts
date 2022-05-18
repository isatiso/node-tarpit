/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

export interface ClassMeta {
    on_destroy?: TypedPropertyDescriptor<any>
    parameter_injection: any[]
}

export interface PropertyMeta {
    disabled?: boolean
    worker?: { channel: string }
    parameter_injection: any[]
}

export interface PluginMeta {
    type: string
    loader_list: string[]
    option_key: string
}
