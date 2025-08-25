/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform, TpService } from '@tarpit/core'
import { describe, it, vi, beforeAll, afterAll } from 'vitest'
import { ScheduleHooks, ScheduleModule, Task, TaskContext, throw_task_retry, TpSchedule } from '../src'

describe('hooks case', function() {

    @TpService()
    class CustomHooks extends ScheduleHooks {
        override async on_error(context: TaskContext<any>, err: any): Promise<void> {
            throw new Error()
        }

        override async on_init(context: TaskContext<any>): Promise<void> {
            throw new Error()
        }

        override async on_finish<T>(context: TaskContext<any>, res: T): Promise<void> {
            throw new Error()
        }
    }

    @TpSchedule({ imports: [ScheduleModule], providers: [{ provide: ScheduleHooks, useClass: CustomHooks }] })
    class TempSchedule {

        @Task('15 6 * * *', '发通知', { tz: 'Asia/Shanghai' })
        async normal_task() {
        }

        @Task('15 6 * * *', '发通知', { tz: 'Asia/Shanghai' })
        async error_task() {
            throw new Error()
        }

        @Task('15 6 * * *', '发通知', { tz: 'Asia/Shanghai' })
        async retry_task() {
            throw_task_retry(2)
        }
    }

    let fake_time = 1658395732508
    let platform: Platform
    let hooks: ScheduleHooks

    beforeAll(async function() {
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        vi.spyOn(console, 'log').mockImplementation(() => undefined)
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        vi.spyOn(Date, 'now').mockImplementation(() => fake_time)
        platform = new Platform(load_config({})).import(TempSchedule)
        hooks = platform.expose(ScheduleHooks)!
        vi.spyOn(hooks, 'on_init')
        vi.spyOn(hooks, 'on_error')
        vi.spyOn(hooks, 'on_finish')
        await platform.start()
    })

    afterAll(async function() {
        await platform.terminate()
        vi.restoreAllMocks()
    })

    it('should call task at time', async function() {
        fake_time = 1658441700023
        await new Promise(resolve => setTimeout(() => resolve(null), 100))
    })
})
