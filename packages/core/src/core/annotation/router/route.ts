/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ApiMethod } from '../../../http'
import { TokenUtils } from '../../token-utils'
import { DecoratorInstanceMethod } from '../__types__'

/**
 * 将 Tp.TpRouter 中的一个方法标记为请求处理函数。
 *
 * @category Router Annotation
 */
export function Route(methods: ApiMethod[], path_tail?: string,): DecoratorInstanceMethod {
    return (prototype, prop, _) => {
        TokenUtils.RouterFunction(prototype, prop)
            .ensure_default()
            .do(router_function => {
                router_function.path = path_tail ?? prop
                for (const method of methods) {
                    router_function[method] = true
                }
            })
    }
}
