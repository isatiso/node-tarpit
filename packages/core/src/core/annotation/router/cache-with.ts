/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TokenUtils } from '../../token-utils'
import { DecoratorInstanceMethod } from '../__types__'

/**
 * 将 Tp.TpRouter 中的一个请求处理函数标记为结果需要进行缓存。
 *
 * @category Router Annotation
 */
export function CacheWith(prefix?: string, expires?: number): DecoratorInstanceMethod {
    return (prototype, prop, _) => {
        TokenUtils.RouterFunction(prototype, prop)
            .ensure_default()
            .do(router_function => {
                router_function.cache_prefix = prefix
                router_function.cache_expires = expires
            })
    }
}
