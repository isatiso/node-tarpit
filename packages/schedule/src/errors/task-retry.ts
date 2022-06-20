/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TaskError } from './task-error'

export class TaskRetry extends TaskError {
    constructor(public readonly retry_times: number, origin?: any) {
        super({ code: 'ERR.Retry', msg: `Retry ${retry_times} times`, origin })
    }
}

export function throw_task_retry(times: number, origin?: any): never {
    throw new TaskRetry(times, origin)
}
