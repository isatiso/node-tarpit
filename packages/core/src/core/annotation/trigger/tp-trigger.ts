/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { load_component, make_provider_collector, set_touched } from '../../collector'
import { TokenUtils } from '../../token-utils'
import { DecoratorClass, TpTriggerOptions, TriggerFunction } from '../__types__'

/**
 * 把一个类标记为 Tp.TpTrigger，并配置元数据。
 *
 * [[include:core/tp-trigger.md]]
 *
 * @category Tp Core
 * @param options
 */
export function TpTrigger(options?: TpTriggerOptions): DecoratorClass {
    return constructor => {
        const meta = TokenUtils.ComponentMeta(constructor.prototype)
        if (meta.exist() && meta.value.type) {
            throw new Error(`Component ${meta.value.type} is exist -> ${meta.value.name}.`)
        }
        meta.set({
            type: 'TpTrigger',
            name: constructor.name,
            trigger_options: options,
            provider_collector: make_provider_collector(constructor, options),
            on_load: (meta, injector) => load_component(constructor, injector, meta, 'œœ-TpTrigger'),
            function_collector: () => {
                const touched = set_touched(constructor).value
                return Object.values(touched)
                    .filter((item): item is TriggerFunction<any> => item.type === 'TpTriggerFunction')
            },
        })
    }
}
