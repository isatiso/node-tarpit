/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { MetaTools } from '../__tools__/meta-tools'

/**
 * 将 Tp.TpService 中的一个方法标记为清理函数。
 *
 * @category Service Annotation
 */
export function OnDestroy(): MethodDecorator {
    return (prototype, prop, descriptor) => {
        MetaTools.ClassMeta(prototype)
            .ensure_default()
            .do(meta => {
                meta.on_destroy = descriptor
            })
    }
}
