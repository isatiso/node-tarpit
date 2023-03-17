/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform, TpInspector, TpService } from '@tarpit/core'
import chai from 'chai'
import chai_spies from 'chai-spies'
import { ScheduleHooks, ScheduleModule, Task, TaskContext, throw_task_retry, TpSchedule } from '../src'

chai.use(chai_spies)

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
    let inspector: TpInspector
    let hooks: ScheduleHooks
    const sandbox = chai.spy.sandbox()

    before(async function() {
        sandbox.on(console, ['debug', 'log', 'info', 'warn', 'error'], () => undefined)
        chai.spy.on(Date, 'now', () => fake_time)
        platform = new Platform(load_config({})).bootstrap(TempSchedule)
        inspector = platform.expose(TpInspector)!
        hooks = platform.expose(ScheduleHooks)!
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
        sandbox.restore(console)
    })

    it('should call task at time', async function() {
        fake_time = 1658441700023
        await new Promise(resolve => setTimeout(() => resolve(null), 100))
    })
})
