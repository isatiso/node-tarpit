/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TaskError } from './task-error'

export class TaskIgnore extends TaskError {
    constructor(desc?: { code?: string, msg?: string }) {
        super({
            code: desc?.code ?? 'ERR.Ignore',
            msg: desc?.msg ?? 'ignore'
        })
    }
}

export function throw_task_ignore(code?: string, msg?: string): never {
    throw new TaskIgnore({ code, msg })
}
