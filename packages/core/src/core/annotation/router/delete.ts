/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TokenUtils } from '../../token-utils'
import { DecoratorInstanceMethod } from '../__types__'

/**
 * 将 Tp.TpRouter 中的一个方法标记为 DELETE 请求处理函数。
 * 等效于 @Route(['DELETE'], path_tail)
 *
 * @category Router Annotation
 */
export function Delete(path_tail?: string): DecoratorInstanceMethod {
    return (prototype, prop, _) => {
        TokenUtils.RouterFunction(prototype, prop)
            .ensure_default()
            .do(router_function => {
                router_function.path = path_tail ?? prop
                router_function.DELETE = true
            })
    }
}
