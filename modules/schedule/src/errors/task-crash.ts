/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TaskError } from './task-error'

export class TaskCrash extends TaskError {
    constructor(code: string | number, msg: string, origin?: any) {
        super({ code, msg, origin })
    }
}

export function throw_task_crash(code: string | number, msg: string, err?: any): never {
    throw new TaskCrash(code, msg, err)
}
