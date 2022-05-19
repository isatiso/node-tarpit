/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { get_router_function } from '../__tools__'

/**
 * 将 Tp.TpRouter 中的一个方法标记为 POST 请求处理函数。
 * 等效于 @Route(['POST'], path_tail)
 *
 * @category Router Annotation
 */
export function Post(path_tail?: string): MethodDecorator {
    return (prototype, prop, _) => {
        get_router_function(prototype, prop)
            .ensure_default()
            .do(router_function => {
                if (path_tail !== undefined) {
                    router_function.path = path_tail
                }
                router_function.POST = true
            })
    }
}
