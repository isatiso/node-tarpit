/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Constructor } from '@tarpit/core'

/**
 * @private
 *
 * GunsLinger Type, see {@link Gunslinger}.
 *
 * @category Router Extend
 */
export interface IGunslinger<T extends object> {

    new(): Constructor<T>

    mount(path: `/${string}`): Constructor<T> & IGunslinger<T>

    replace(path: string, new_path: string): Constructor<T> & IGunslinger<T>
}

/**
 * Tp.TpRouter 的扩展函数。
 *
 * @category Router Extend
 */
export function Gunslinger<T extends object>(): IGunslinger<T> {
    return class {
    } as any
}
