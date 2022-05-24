/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Constructor, MetaTools } from '@tarpit/core'
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
        MetaTools.ComponentMeta(constructor.prototype)
            .if_exist(meta => {
                throw new Error(`Component ${meta.type} is exist -> ${meta.name}.`)
            }).set<TpScheduleMeta>({
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
