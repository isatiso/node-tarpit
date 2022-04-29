/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TokenUtils } from '../../token-utils'
import { DecoratorInstanceMethod } from '../__types__'

/**
 * 将 Tp.TpTrigger 中的一个任务标记为需要上锁。
 * 通过实现 TaskLock 并注入服务来实现任务的锁机制。
 *
 * @category Trigger Annotation
 * @param lock_options
 */
export function Lock(lock_options?: { key: string, expires?: number }): DecoratorInstanceMethod {
    return (prototype, prop, _) => {
        TokenUtils.TriggerFunction(prototype, prop)
            .ensure_default()
            .do(trigger_function => {
                trigger_function.lock_key = lock_options?.key
                trigger_function.lock_expires = lock_options?.expires
            })
    }
}
