/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpServiceMeta, TpServiceOptions } from '../__tools__/component-types'
import { TokenTools } from '../__tools__/token-tools'
import { Injector } from '../injector'
import { ClassProvider } from '../provider'

/**
 * 把一个类标记为 Tp.TpService。
 *
 * @category Service Annotation
 * @param options
 */
export function TpService(options?: TpServiceOptions): ClassDecorator {
    return constructor => {
        TokenTools.ComponentMeta(constructor.prototype)
            .if_exist(meta => {
                throw new Error(`Component ${meta.type} is exist -> ${meta.name}.`)
            })
            .set({
                type: 'TpService',
                loader: 'œœ-TpService',
                category: 'service',
                name: constructor.name,
                on_load: (meta: TpServiceMeta, injector: Injector) => meta.provider = injector.set_provider(constructor, new ClassProvider(constructor as any, injector)),
            })
    }
}
