/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { default_router_unit } from '../__tools__'

/**
 * 将 Tp.TpRouter 中的一个方法标记为 POST 请求处理函数。
 * 等效于 @Route(['POST'], path_tail)
 *
 * @category Router Annotation
 */
export function Post(path_tail?: string): MethodDecorator {
    return (prototype, prop, _) => {
        default_router_unit(prototype, prop)
            .do(unit => unit.path = path_tail ?? unit.path)
            .do(unit => unit.POST = true)
    }
}
