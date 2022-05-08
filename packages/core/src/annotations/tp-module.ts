/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DecoratorClass } from '../__types__/'
import { make_provider_collector } from '../__tools__/collector'
import { TpModuleOptions } from '../__tools__/component-types'
import { TokenTools } from '../__tools__/token-tools'

/**
 * 把一个类标记为 Tp.TpModule，并提供配置元数据。
 *
 * @category Module Annotation
 * @param options
 */
export function TpModule(options?: TpModuleOptions): DecoratorClass {
    return constructor => {
        const meta = TokenTools.ComponentMeta(constructor.prototype)
        if (meta.exist() && meta.value.type) {
            throw new Error(`Component ${meta.value.type} is exist -> ${meta.value.name}.`)
        }
        meta.set({
            type: 'TpModule',
            name: constructor.name,
            provider_collector: make_provider_collector(constructor, 'TpModule', options),
            loader: '∑∫πœ-TpModule'
        })
    }
}
