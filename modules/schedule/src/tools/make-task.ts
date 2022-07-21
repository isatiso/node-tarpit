/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { get_providers, Injector } from '@tarpit/core'
import { Bullet } from '../builtin/bullet'
import { TaskContext } from '../builtin/task-context'
import { TaskCrash, TaskDone, TaskError, TaskRetry } from '../errors'
import { ScheduleHooks } from '../services/schedule-hooks'
import { TaskUnit } from './collect-tasks'

function wrap_error(reason: any) {
    return new TaskCrash('ERR.Crash', 'Internal Program Error', { origin: reason })
}

export function make_task(injector: Injector, unit: TaskUnit): (task: Bullet) => Promise<void> {

    const param_deps = get_providers(unit, injector, new Set([TaskContext]))
    const hooks_provider = injector.get(ScheduleHooks)!

    return async function(task) {

        const hooks = hooks_provider.create()
        const context = TaskContext.from<any>(task)

        await hooks.on_init(context).catch(() => undefined)

        const params = param_deps.map(({ provider, token }, index) => {
            if (provider) {
                return provider.create([{ token: `${unit.cls.name}.${unit.prop.toString()}`, index }])
            } else if (token === TaskContext) {
                return context
            } else {
                return undefined
            }
        })

        let handle_result: any
        while (context.incr() <= context.retry_limit + 1) {
            try {
                handle_result = await unit.handler(...params)
            } catch (reason: any) {
                if (reason instanceof TaskDone) {
                    handle_result = await Promise.resolve(reason.res).catch((err: any) => err instanceof TaskError ? err : wrap_error(err))
                } else if (reason instanceof TaskError) {
                    handle_result = reason
                } else {
                    handle_result = wrap_error(reason)
                }
                if (handle_result instanceof TaskRetry) {
                    context.set_retry_limit(handle_result.retry_times)
                    await hooks.on_error(context, handle_result).catch(() => undefined)
                    continue
                }
            }
            break
        }

        if (handle_result instanceof TaskError) {
            await hooks.on_error(context, handle_result).catch(() => undefined)
        } else {
            await hooks.on_finish(context, handle_result).catch(() => undefined)
        }
    }
}
