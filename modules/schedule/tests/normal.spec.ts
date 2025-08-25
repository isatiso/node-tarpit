/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Optional, Platform, TpService } from '@tarpit/core'
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { ScheduleInspector, ScheduleModule, Task, TaskContext, TpSchedule } from '../src'

describe('normal case', function() {

    let count = 0

    @TpService()
    class TempService {

    }

    @TpSchedule({ imports: [ScheduleModule], providers: [TempService] })
    class TempSchedule {

        @Task('15 6 * * *', '发通知', { tz: 'Asia/Shanghai' })
        async do_something(
            context: TaskContext,
            service: TempService,
            @Optional() a?: number
        ) {
            count++
        }
    }

    let fake_time = 1658395732508
    let platform: Platform
    let schedule_inspector: ScheduleInspector

    beforeAll(async function() {
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        vi.spyOn(console, 'log').mockImplementation(() => undefined)
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        vi.spyOn(Date, 'now').mockImplementation(() => fake_time)
        platform = new Platform(load_config({})).import(TempSchedule)
        schedule_inspector = platform.expose(ScheduleInspector)!
        await platform.start()
    })

    afterAll(async function() {
        await platform.terminate()
        vi.restoreAllMocks()
    })

    it('should call task at time', async function() {
        expect(count).toEqual(0)
        await new Promise(resolve => setTimeout(() => resolve(null), 100))
        expect(count).toEqual(0)
        fake_time = 1658441700000
        await new Promise(resolve => setTimeout(() => resolve(null), 100))
        expect(count).toEqual(1)
        await new Promise(resolve => setTimeout(() => resolve(null), 100))
        expect(count).toEqual(1)
    })
})
