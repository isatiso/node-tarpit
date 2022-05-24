/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { default_schedule_unit } from '../__tools__'

/**
 * 将 Tora.TpSchedule 中的一个任务标记为需要上锁。
 * 通过实现 TaskLock 并注入服务来实现任务的锁机制。
 *
 * @category Trigger Annotation
 * @param lock_options
 */
export function Lock(lock_options?: { key: string, expires?: number }): MethodDecorator {
    return (prototype, prop, _) => {
        default_schedule_unit(prototype, prop)
            .do(unit => unit.lock_key = lock_options?.key)
            .do(unit => unit.lock_expires = lock_options?.expires)
    }
}
