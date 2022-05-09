/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DecoratorInstanceMethod } from '@tarpit/core'
import { get_schedule_function } from '../__tools__'

/**
 * 将 Tora.TpSchedule 中的一个任务标记为需要上锁。
 * 通过实现 TaskLock 并注入服务来实现任务的锁机制。
 *
 * @category Trigger Annotation
 * @param lock_options
 */
export function Lock(lock_options?: { key: string, expires?: number }): DecoratorInstanceMethod {
    return (prototype, prop, _) => {
        get_schedule_function(prototype, prop)
            .ensure_default()
            .do(schedule_function => {
                schedule_function.lock_key = lock_options?.key
                schedule_function.lock_expires = lock_options?.expires
            })
    }
}
