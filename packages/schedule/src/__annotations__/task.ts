/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { get_schedule_function } from '../__tools__'
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
        get_schedule_function(prototype, prop)
            .ensure_default()
            .do(schedule_function => {
                schedule_function.crontab_str = crontab
                schedule_function.name = options?.name
                schedule_function.task_options = options
            })
    }
}
