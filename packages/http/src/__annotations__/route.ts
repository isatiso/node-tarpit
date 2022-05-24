/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { default_router_unit } from '../__tools__'
import { ApiMethod } from '../__types__'

/**
 * 将 Tp.TpRouter 中的一个方法标记为请求处理函数。
 *
 * @category Router Annotation
 */
export function Route(methods: ApiMethod[], path_tail?: string,): MethodDecorator {
    return (prototype, prop, _) => {
        default_router_unit(prototype, prop)
            .do(unit => unit.path = path_tail ?? unit.path)
            .do(unit => methods.forEach(method => unit[method] = true))
    }
}
