/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TokenUtils } from '../../token-utils'
import { DecoratorInstanceMethod } from '../__types__'

/**
 * 将 Tp.TpService 中的一个方法标记为清理函数。
 *
 * @category Service Annotation
 */
export function OnDestroy(): DecoratorInstanceMethod {
    return (prototype, prop, descriptor) => {
        TokenUtils.ClassMeta(prototype)
            .ensure_default()
            .do(meta => {
                meta.on_destroy = descriptor
            })
    }
}
