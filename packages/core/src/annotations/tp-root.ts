/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpMeta } from '../__tools__/tp-meta'
import { MetaTools } from '../__tools__/tp-meta-tools'
import { TpRootMeta, TpRootOptions } from '../tp-component-type'

/**
 * 把一个类标记为 Tp.TpRoot，并提供配置元数据。
 *
 * @category Root Annotation
 * @param options
 */
export function TpRoot(options?: TpRootOptions): ClassDecorator {
    return (constructor) => {
        const meta: TpMeta<TpRootMeta | undefined> = MetaTools.ComponentMeta(constructor.prototype) as any
        if (meta.exist() && meta.value.type) {
            throw new Error(`Component ${meta.value.type} is exist -> ${meta.value.name}.`)
        }
        meta.set({
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
