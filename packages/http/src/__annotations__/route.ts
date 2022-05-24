/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { default_router_unit } from '../__tools__'
import { ApiMethod } from '../__types__'

const method_map = {
    GET: 'uh_get' as 'uh_get',
    POST: 'uh_post' as 'uh_post',
    PUT: 'uh_put' as 'uh_put',
    DELETE: 'uh_delete' as 'uh_delete',
}

/**
 * 将 Tp.TpRouter 中的一个方法标记为请求处理函数。
 *
 * @category Router Annotation
 */
export function Route(methods: ApiMethod[], path_tail?: string,): MethodDecorator {
    return (prototype, prop, _) => {
        default_router_unit(prototype, prop)
            .do(unit => unit.uh_path = path_tail ?? unit.uh_path)
            .do(unit => methods.forEach(method => unit[method_map[method]] = true))
    }
}
