/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { MetaTools } from '../__tools__/tp-meta-tools'
import { TpModuleOptions } from '../tp-component-type'

/**
 * 把一个类标记为 Tp.TpModule，并提供配置元数据。
 *
 * @category Module Annotation
 * @param options
 */
export function TpModule(options?: TpModuleOptions): ClassDecorator {
    return constructor => {
        MetaTools.ComponentMeta(constructor.prototype)
            .if_exist(meta => {
                throw new Error(`Component ${meta.type} is exist -> ${meta.name}.`)
            })
            .set({
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
