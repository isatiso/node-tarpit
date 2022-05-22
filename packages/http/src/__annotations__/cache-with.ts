/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { get_router_unit } from '../__tools__'

/**
 * 将 Tp.TpRouter 中的一个请求处理函数标记为结果需要进行缓存。
 *
 * @category Router Annotation
 */
export function CacheWith(prefix?: string, expires?: number): MethodDecorator {
    return (prototype, prop, _) => {
        get_router_unit(prototype, prop)
            .ensure_default()
            .do(unit => unit.cache_prefix = prefix)
            .do(unit => unit.cache_expires = expires)
    }
}
