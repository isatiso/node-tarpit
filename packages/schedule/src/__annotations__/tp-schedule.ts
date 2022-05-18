/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { collect_function, collect_provider, DecoratorClass, load_component, Meta, TokenTools } from '@tarpit/core'
import { ScheduleFunction, TpScheduleMeta, TpScheduleOptions } from '../__types__'

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
            loader: 'œœ-TpSchedule',
            category: 'module',
            name: constructor.name,
            schedule_options: options,
            provider_collector: collect_provider(constructor, options),
            function_collector: () => collect_function<ScheduleFunction<any>>(constructor, 'TpScheduleFunction'),
            on_load: (meta, injector) => load_component(constructor, injector, meta),
        })
    }
}
