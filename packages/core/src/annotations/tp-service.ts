/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TpServiceMeta, TpServiceOptions } from '../__tools__/component-types'
import { TokenTools } from '../__tools__/token-tools'
import { DecoratorClass, } from '../__types__'
import { Injector } from '../injector'
import { ClassProvider } from '../provider'

/**
 * 把一个类标记为 Tp.TpService。
 *
 * @category Service Annotation
 * @param options
 */
export function TpService(options?: TpServiceOptions): DecoratorClass {
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
                on_load: (meta: TpServiceMeta, injector: Injector) => meta.provider = injector.set_provider(constructor, new ClassProvider(constructor, injector)),
            })
    }
}
