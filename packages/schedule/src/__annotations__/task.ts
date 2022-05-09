/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */


import { DecoratorInstanceMethod } from '@tarpit/core'
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
export function Task(crontab: string, options?: TaskOptions): DecoratorInstanceMethod {
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
