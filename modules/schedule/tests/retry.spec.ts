/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform } from '@tarpit/core'
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { ScheduleHooks, ScheduleModule, Task, TaskRetry, throw_task_retry, TpSchedule } from '../src'

describe('retry case', function() {

    let retry_exec = 0

    @TpSchedule({ imports: [ScheduleModule] })
    class TempSchedule {

        @Task('15 6 * * *', '发通知', { tz: 'Asia/Shanghai' })
        async throw_retry_error() {
            retry_exec++
            throw_task_retry(4)
        }

        @Task('15 6 * * *', '发通知', { tz: 'Asia/Shanghai' })
        async throw_retry() {
            throw new TaskRetry(4)
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
        expect(retry_exec).toEqual(5)
    })
})
