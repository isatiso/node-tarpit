/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { default_router_unit } from '../__tools__'

/**
 * 将 Tp.TpRouter 中的一个请求处理函数标记为结果不需要进行 wrap 操作。
 *
 * @category Router Annotation
 */
export function NoWrap(): MethodDecorator {
    return (prototype, prop, _) => {
        default_router_unit(prototype, prop)
            .do(unit => unit.wrap_result = false)
    }
}
