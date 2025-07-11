/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Optional, Platform, TpService } from '@tarpit/core'
import chai, { expect } from 'chai'
import chai_spies from 'chai-spies'
import { ScheduleInspector, ScheduleModule, Task, TaskContext, TpSchedule } from '../src'

chai.use(chai_spies)

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
    const sandbox = chai.spy.sandbox()

    before(async function() {
        sandbox.on(console, ['debug', 'log', 'info', 'warn', 'error'], () => undefined)
        chai.spy.on(Date, 'now', () => fake_time)
        platform = new Platform(load_config({})).import(TempSchedule)
        schedule_inspector = platform.expose(ScheduleInspector)!
        await platform.start()
    })

    after(async function() {
        await platform.terminate()
        chai.spy.restore(Date)
        sandbox.restore()
    })

    it('should call task at time', async function() {
        expect(count).to.equal(0)
        await new Promise(resolve => setTimeout(() => resolve(null), 100))
        expect(count).to.equal(0)
        fake_time = 1658441700000
        await new Promise(resolve => setTimeout(() => resolve(null), 100))
        expect(count).to.equal(1)
        await new Promise(resolve => setTimeout(() => resolve(null), 100))
        expect(count).to.equal(1)
    })
})
