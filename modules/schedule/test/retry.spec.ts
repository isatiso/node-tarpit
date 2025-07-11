/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform } from '@tarpit/core'
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
    let platform: Platform
    let hooks: ScheduleHooks

    const sandbox = chai.spy.sandbox()

    before(async function() {
        sandbox.on(console, ['debug', 'log', 'info', 'warn', 'error'], () => undefined)
        chai.spy.on(Date, 'now', () => fake_time)
        platform = new Platform(load_config({})).import(TempSchedule)
        hooks = platform.expose(ScheduleHooks)!
        chai.spy.on(hooks, 'on_init')
        chai.spy.on(hooks, 'on_error')
        chai.spy.on(hooks, 'on_finish')
        await platform.start()
    })

    after(async function() {
        await platform.terminate()
        chai.spy.restore(Date)
        sandbox.restore()
    })

    it('should call task at time', async function() {
        fake_time = 1658441700023
        await new Promise(resolve => setTimeout(() => resolve(null), 100))
        expect(retry_exec).to.equal(5)
    })
})
