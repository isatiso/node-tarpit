/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TaskError } from './task-error'

export class TaskIgnore extends TaskError {
    constructor() {
        super({ code: 'ERR.Ignore', msg: 'ignore' })
    }
}

export function throw_task_ignore(): never {
    throw new TaskIgnore()
}
