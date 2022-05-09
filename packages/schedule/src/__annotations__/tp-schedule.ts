/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { check_used, DecoratorClass, load_component, make_provider_collector, Meta, set_touched, TokenTools } from '@tarpit/core'
import { ScheduleFunction, TpScheduleMeta, TpScheduleOptions } from '../__type__'

/**
 * 把一个类标记为 Tp.TpSchedule，并配置元数据。
 *
 * [[include:core/tora-trigger.md]]
 *
 * @category Tora Core
 * @param options
 */
export function TpSchedule(options?: TpScheduleOptions): DecoratorClass {
    return constructor => {
        const meta: Meta<TpScheduleMeta | undefined> = TokenTools.ComponentMeta(constructor.prototype) as any
        if (meta.exist() && meta.value.type) {
            throw new Error(`Component ${meta.value.type} is exist -> ${meta.value.name}.`)
        }
        meta.set({
            type: 'TpSchedule',
            loader: '∑∫πœ-TpSchedule',
            is_module_like: true,
            name: constructor.name,
            schedule_options: options,
            provider_collector: make_provider_collector(constructor, options),
            on_load: (meta, injector) => {
                const provider_tree = load_component(constructor, injector, meta)
                check_used(provider_tree, constructor)
            },
            function_collector: () => {
                const touched = set_touched(constructor).value
                return Object.values(touched)
                    .filter((item): item is ScheduleFunction<any> => item.type === 'TpScheduleFunction')
            },
        })
    }
}
