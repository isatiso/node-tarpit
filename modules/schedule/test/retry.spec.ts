/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Platform, TpInspector } from '@tarpit/core'
import chai, { expect } from 'chai'
import chai_spies from 'chai-spies'
import { ScheduleHooks, ScheduleModule, Task, TaskRetry, throw_task_retry, TpSchedule } from '../src'

chai.use(chai_spies)

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
    let platform = new Platform({}).bootstrap(TempSchedule)
    const inspector = platform.expose(TpInspector)!
    const hooks = platform.expose(ScheduleHooks)!
    const tmp = console.log

    before(async function() {
        console.log = (..._args: any[]) => undefined
        chai.spy.on(Date, 'now', () => fake_time)
        chai.spy.on(hooks, 'on_init')
        chai.spy.on(hooks, 'on_error')
        chai.spy.on(hooks, 'on_finish')
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
        fake_time = 1658441700023
        await new Promise(resolve => setTimeout(() => resolve(null), 100))
        expect(retry_exec).to.equal(5)
    })
})
