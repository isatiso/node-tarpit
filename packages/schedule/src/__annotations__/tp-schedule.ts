/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Constructor, MetaTools, TpMeta } from '@tarpit/core'
import { TpScheduleMeta, TpScheduleOptions } from '../__types__'

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
            category: 'assembly',
            name: constructor.name,
            self: constructor as unknown as Constructor<any>,
            imports: options?.imports ?? [],
            providers: options?.providers ?? [],
            schedule_options: options,
        })
    }
}
