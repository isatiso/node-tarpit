/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Optional, Platform, TpInspector, TpService } from '@tarpit/core'
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
    let platform = new Platform({}).bootstrap(TempSchedule)
    const inspector = platform.expose(TpInspector)!
    const schedule_inspector = platform.expose(ScheduleInspector)!
    const tmp = console.log

    before(async function() {
        console.log = (..._args: any[]) => undefined
        chai.spy.on(Date, 'now', () => fake_time)
        platform.start()
        await inspector.wait_start()
    })

    after(async function() {
        platform.terminate()
        await inspector.wait_terminate()
        chai.spy.restore(Date)
        console.log = tmp
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
