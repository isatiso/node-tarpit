/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
