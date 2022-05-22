/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpMeta } from '../__tools__/tp-meta'
import { MetaTools } from '../__tools__/tp-meta-tools'
import { TpModuleMeta, TpModuleOptions } from '../tp-component-type'

/**
 * 把一个类标记为 Tp.TpModule，并提供配置元数据。
 *
 * @category Module Annotation
 * @param options
 */
export function TpModule(options?: TpModuleOptions): ClassDecorator {
    return constructor => {
        const meta: TpMeta<TpModuleMeta | undefined> = MetaTools.ComponentMeta(constructor.prototype) as any
        if (meta.exist() && meta.value.type) {
            throw new Error(`Component ${meta.value.type} is exist -> ${meta.value.name}.`)
        }
        meta.set({
            type: 'TpModule',
            loader: 'œœ-TpModule',
            category: 'assembly',
            name: constructor.name,
            self: constructor as any,
            imports: options?.imports ?? [],
            providers: options?.providers ?? [],
        })
    }
}
