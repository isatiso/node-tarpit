/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { get_router_unit } from '../__tools__'

/**
 * 将 Tp.TpRouter 中的一个方法标记为 PUT 请求处理函数。
 * 等效于 @Route(['PUT'], path_tail)
 *
 * @category Router Annotation
 */
export function Put(path_tail?: string): MethodDecorator {
    return (prototype, prop, _) => {
        get_router_unit(prototype, prop)
            .ensure_default()
            .do(unit => unit.path = path_tail ?? unit.path)
            .do(unit => unit.PUT = true)
    }
}
