/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '@tarpit/core'
import { Dora } from '@tarpit/dora'
import { TaskContext } from '../builtin/task-context'
import { TaskCrash, TaskError, TaskIgnore, TaskRetry } from '../errors'

type Context = TaskContext<{ process_start: number }>

export function assemble_duration(context: Context) {
    const start = context.get('process_start')
    return start ? Date.now() - start : -1
}

export function create_log(context: Context, duration: number, err?: TaskError) {
    const time_str = Dora.now().format('YYYY-MM-DDTHH:mm:ssZZ')

    const duration_str = `${duration}ms`.padStart(12)
    if (err instanceof TaskRetry) {
        const type = 'retry    '
        console.log(`[${time_str}] ${duration_str} ${type}`, context.unit.task_name, `<${err.code} ${err.msg}, failed ${context.count} times>`)
    } else if (err instanceof TaskCrash) {
        const type = 'crash    '
        console.log(`[${time_str}] ${duration_str} ${type}`, context.unit.task_name, `<${err.code} ${err.msg}>`)
    } else if (err instanceof TaskIgnore) {
        const type = 'ignore   '
        console.log(`[${time_str}] ${duration_str} ${type}`, context.unit.task_name, `<${err.code} ${err.msg}>`)
    } else {
        const type = 'success  '
        console.log(`[${time_str}] ${duration_str} ${type}`, context.unit.task_name)
    }
}

@TpService({ inject_root: true })
export class ScheduleHooks {

    async on_init(context: Context): Promise<void> {
        context.set('process_start', Date.now())
    }

    async on_finish<T>(context: Context, res: T): Promise<void> {
        const duration = assemble_duration(context)
        create_log(context, duration)
    }

    async on_error(context: Context, err: any): Promise<void> {
        const duration = assemble_duration(context)
        create_log(context, duration, err)
    }
}
