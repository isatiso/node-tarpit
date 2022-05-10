/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { collect_provider } from '../__tools__/collector'
import { TpModuleMeta, TpModuleOptions } from '../__tools__/component-types'
import { Meta } from '../__tools__/meta'
import { TokenTools } from '../__tools__/token-tools'
import { DecoratorClass } from '../__types__/'

/**
 * 把一个类标记为 Tp.TpModule，并提供配置元数据。
 *
 * @category Module Annotation
 * @param options
 */
export function TpModule(options?: TpModuleOptions): DecoratorClass {
    return constructor => {
        const meta: Meta<TpModuleMeta | undefined> = TokenTools.ComponentMeta(constructor.prototype) as any
        if (meta.exist() && meta.value.type) {
            throw new Error(`Component ${meta.value.type} is exist -> ${meta.value.name}.`)
        }
        meta.set({
            type: 'TpModule',
            loader: 'œœ-TpModule',
            category: 'module',
            name: constructor.name,
            provider_collector: collect_provider(constructor, options),
        })
    }
}
