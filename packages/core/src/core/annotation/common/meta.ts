/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TokenUtils } from '../../token-utils'
import { DecoratorClass } from '../__types__'

/**
 * 向 Class 标记一些自定义元信息（CustomData），在自定义装饰器工具 `AnnotationTools` 中会很有用。
 *
 * ```
 * @Meta({ a: 1, b: 'b' })
 * class SomeClass {
 * }
 *
 * // 等效于
 *
 * AnnotationTools.define_custom_data(SomeClass.prototype, a, 1)
 * AnnotationTools.define_custom_data(SomeClass.prototype, b, 'b')
 * ```
 *
 * @category Common Annotation
 */
export function Meta<T extends object = any>(meta: T): DecoratorClass {
    return constructor => {
        TokenUtils.CustomData(constructor.prototype).ensure_default().do(origin_meta => {
            Object.entries(meta).forEach(([k, v]) => {
                origin_meta[k] = v
            })
        })
    }
}
