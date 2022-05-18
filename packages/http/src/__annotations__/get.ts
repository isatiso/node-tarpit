/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { DecoratorInstanceMethod } from '@tarpit/core'
import { get_router_function } from '../__tools__'

/**
 * 将 Tp.TpRouter 中的一个方法标记为 GET 请求处理函数。
 * 等效于 @Route(['GET'], path_tail)
 *
 * @category Router Annotation
 */
export function Get(path_tail?: string): DecoratorInstanceMethod {
    return (prototype, prop, _) => {
        get_router_function(prototype, prop)
            .ensure_default()
            .do(router_function => {
                router_function.path = path_tail ?? prop
                router_function.GET = true
            })
    }
}
