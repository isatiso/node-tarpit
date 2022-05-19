/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { get_router_function } from '../__tools__'

/**
 * 将 Tp.TpRouter 中的一个请求处理函数标记为需要进行授权。
 *
 * @category Router Annotation
 */
export function Auth(): MethodDecorator {
    return (prototype, prop, _) => {
        get_router_function(prototype, prop)
            .ensure_default()
            .do(router_function => router_function.auth = true)
    }
}
