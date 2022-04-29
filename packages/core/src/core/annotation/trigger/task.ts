/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ScheduleOptions } from '../../../schedule'
import { TokenUtils } from '../../token-utils'
import { DecoratorInstanceMethod } from '../__types__'

/**
 * 将 Tp.TpTrigger 中的一个方法标记为一个任务。
 *
 * @category Trigger Annotation
 *
 * @param crontab 任务计划
 * @param options
 * @constructor
 */
export function Task(crontab: string, options?: ScheduleOptions): DecoratorInstanceMethod {
    return (prototype, prop, _) => {
        TokenUtils.TriggerFunction(prototype, prop)
            .ensure_default()
            .do(trigger_function => {
                trigger_function.crontab = crontab
                trigger_function.name = options?.name
                trigger_function.schedule_options = options
            })
    }
}
