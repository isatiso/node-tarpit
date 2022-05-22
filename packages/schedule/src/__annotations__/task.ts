/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { get_schedule_unit } from '../__tools__'
import { TaskOptions } from '../__types__'

/**
 * 将 Tora.TpSchedule 中的一个方法标记为一个任务。
 *
 * @category Trigger Annotation
 *
 * @param crontab 任务计划
 * @param options
 * @constructor
 */
export function Task(crontab: string, options?: TaskOptions): MethodDecorator {
    return (prototype, prop, _) => {
        get_schedule_unit(prototype, prop)
            .ensure_default()
            .do(unit => unit.crontab_str = crontab)
            .do(unit => unit.name = options?.name)
            .do(unit => unit.task_options = options)
    }
}
