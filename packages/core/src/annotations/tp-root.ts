/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { MetaTools } from '../__tools__/tp-meta-tools'
import { TpRootOptions } from '../tp-component-type'

/**
 * 把一个类标记为 Tp.TpRoot，并提供配置元数据。
 *
 * @category Root Annotation
 * @param options
 */
export function TpRoot(options?: TpRootOptions): ClassDecorator {
    return constructor => {
        MetaTools.ComponentMeta(constructor.prototype)
            .if_exist(meta => {
                throw new Error(`Component ${meta.type} is exist -> ${meta.name}.`)
            })
            .set({
                ...options,
                type: 'TpRoot',
                loader: 'œœ-TpRoot',
                category: 'assembly',
                self: constructor as any,
                imports: options?.imports ?? [],
                providers: options?.providers ?? [],
                name: constructor.name,
            })
    }
}
