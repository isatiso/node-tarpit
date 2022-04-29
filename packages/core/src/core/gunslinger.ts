/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Constructor } from './annotation'

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
