/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform } from '@tarpit/core'
import { describe, it, vi, beforeAll, afterAll } from 'vitest'
import { mission_completed, ScheduleHooks, ScheduleModule, Task, TaskCrash, TaskDone, TaskError, TaskIgnore, throw_task_crash, throw_task_ignore, TpSchedule } from '../src'

describe('error case', function() {

    @TpSchedule({ imports: [ScheduleModule] })
    class TempSchedule {

        @Task('15 5 * * *', 'throw task done with native error', { tz: 'Asia/Shanghai' })
        async throw_task_done_with_native_error() {
            mission_completed(new Promise((resolve, reject) => reject(new Error('asd'))))
        }

        @Task('15 5 * * *', 'throw task done with task error', { tz: 'Asia/Shanghai' })
        async throw_task_done_with_task_error() {
            mission_completed(new Promise((resolve, reject) => reject(new TaskIgnore())))
        }

        @Task('15 5 * * *', 'throw task done with task error', { tz: 'Asia/Shanghai' })
        async throw_task_done() {
            throw new TaskDone()
        }

        @Task('15 6 * * *', 'throw native error', { tz: 'Asia/Shanghai' })
        async throw_native_error() {
            throw new Error('asd')
        }

        @Task('15 7 * * *', 'throw crash error', { tz: 'Asia/Shanghai' })
        async throw_crash_error() {
            throw_task_crash('ERR.Crash', 'jesus')
        }

        @Task('15 7 * * *', 'throw crash error', { tz: 'Asia/Shanghai' })
        async throw_crash_error_dir() {
            throw new TaskCrash('ERR.Crash', 'jesus')
        }

        @Task('15 7 * * *', 'throw crash error', { tz: 'Asia/Shanghai' })
        async throw_ignore_error() {
            throw_task_ignore('ERR.ignore')
        }

        @Task('15 7 * * *', 'throw crash error', { tz: 'Asia/Shanghai' })
        async throw_task_error() {
            throw new TaskError({ code: 'ERR.ignore', msg: 'some message' })
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
        fake_time = 1658438100000
        await new Promise(resolve => setTimeout(() => resolve(null), 100))
        fake_time = 1658441700023
        await new Promise(resolve => setTimeout(() => resolve(null), 100))
        fake_time = 1658445300000
        await new Promise(resolve => setTimeout(() => resolve(null), 100))
    })
})
