/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { MetaTools } from '../__tools__/tp-meta-tools'
import { TpServiceOptions } from '../tp-component-type'

/**
 * 把一个类标记为 Tp.TpService。
 *
 * @category Service Annotation
 * @param options
 */
export function TpService(options?: TpServiceOptions): ClassDecorator {
    return constructor => {
        MetaTools.ComponentMeta(constructor.prototype)
            .if_exist(meta => {
                throw new Error(`Component ${meta.type} is exist -> ${meta.name}.`)
            })
            .set({
                type: 'TpService',
                name: constructor.name,
                loader: 'œœ-TpService',
                category: 'worker',
                self: constructor as any,
            })
    }
}
