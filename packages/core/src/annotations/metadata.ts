/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { MetaTools } from '../__tools__/tp-meta-tools'

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
export function MetaData<T extends object = any>(meta: T): ClassDecorator {
    return constructor => {
        MetaTools.default_custom_data(constructor.prototype)
            .do(custom_meta => Object.entries(meta).forEach(([k, v]) => custom_meta.set(k, v)))
    }
}
