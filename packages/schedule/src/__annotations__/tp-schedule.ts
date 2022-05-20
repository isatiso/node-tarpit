/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { collect_function, collect_provider, load_component, TpMeta, MetaTools } from '@tarpit/core'
import { ScheduleFunction, TpScheduleMeta, TpScheduleOptions } from '../__types__'

/**
 * 把一个类标记为 Tp.TpSchedule，并配置元数据。
 *
 * [[include:core/tora-trigger.md]]
 *
 * @category Tora Core
 * @param options
 */
export function TpSchedule(options?: TpScheduleOptions): ClassDecorator {
    return constructor => {
        const meta: TpMeta<TpScheduleMeta | undefined> = MetaTools.ComponentMeta(constructor.prototype) as any
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
            function_collector: () => collect_function<ScheduleFunction<any>>(constructor as any, 'TpScheduleFunction'),
            on_load: (meta, injector) => load_component(constructor as any, injector, meta),
        })
    }
}
