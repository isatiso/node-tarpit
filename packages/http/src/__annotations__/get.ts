/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { default_router_unit } from '../__tools__'

/**
 * 将 Tp.TpRouter 中的一个方法标记为 GET 请求处理函数。
 * 等效于 @Route(['GET'], path_tail)
 *
 * @category Router Annotation
 */
export function Get(path_tail?: string): MethodDecorator {
    return (prototype, prop, _) => {
        default_router_unit(prototype, prop)
            .do(unit => unit.uh_path = path_tail ?? unit.uh_path)
            .do(unit => unit.uh_get = true)
    }
}
