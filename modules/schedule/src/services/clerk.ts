/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { get_providers, Injector, SymbolToken, TpService } from '@tarpit/core'
import { Dora } from '@tarpit/dora'
import { throw_native_error } from '@tarpit/error'
import { Bullet } from '../builtin/bullet'
import { TriggerContext } from '../builtin/trigger-context'
import { TaskCrash, TaskDone, TaskError, TaskRetry } from '../errors'

import { TaskUnit } from '../tools'
import { AbstractTriggerHooks } from './inner/abstract-trigger-hooks'

const ALL_TRIGGER_TOKEN_SET = new Set([TriggerContext])

@SymbolToken('schedule')
@TpService({ inject_root: true })
export class Clerk {

    make_task(injector: Injector, unit: TaskUnit): (execution: Dora, task: Bullet) => Promise<void> {

        const param_deps = get_providers(unit, injector, ALL_TRIGGER_TOKEN_SET)
        const trigger_hooks_provider = injector.get(AbstractTriggerHooks) ?? throw_native_error('No provider for AbstractTriggerHooks')

        return async function(execution, task) {

            const trigger_hooks = trigger_hooks_provider.create()
            const context = TriggerContext.from(task)

            let handle_result: any

            async function handle() {
                return unit.handler(...param_deps.map(({ provider, token }, index) => {
                    if (provider) {
                        return provider.create([{ token: `${unit.cls.name}.${unit.prop.toString()}`, index }])
                    }
                    switch (token) {
                        case TriggerContext:
                            return context
                        default:
                            return undefined
                    }
                }))
            }

            await trigger_hooks?.on_init(context)

            while (context.count < context.retry_limit + 1) {
                (context as any)._count++
                try {
                    handle_result = await handle()
                } catch (reason) {
                    if (reason instanceof TaskRetry) {
                        handle_result = reason
                        context.retry_limit = reason.retry_times
                        continue
                    }
                    if (reason instanceof TaskDone) {
                        handle_result = await reason.res
                    } else if (reason instanceof TaskError) {
                        handle_result = reason
                    } else {
                        handle_result = new TaskCrash('ERR.Crash', 'Internal Program Error', { origin: reason })
                    }
                    break
                }
            }

            if (handle_result instanceof TaskError) {
                await trigger_hooks?.on_error(context, handle_result)
                if (handle_result instanceof TaskCrash) {
                    throw handle_result
                }
            } else {
                await trigger_hooks?.on_finish(context, handle_result)
            }
        }
    }
}
