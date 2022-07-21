/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Platform, TpInspector, TpService } from '@tarpit/core'
import chai from 'chai'
import chai_spies from 'chai-spies'
import { ScheduleHooks, ScheduleModule, Task, TaskContext, throw_task_retry, TpSchedule } from '../src'

chai.use(chai_spies)

describe('hooks case', function() {

    @TpService()
    class CustomHooks extends ScheduleHooks {
        async on_error(context: TaskContext<any>, err: any): Promise<void> {
            throw new Error()
        }

        async on_init(context: TaskContext<any>): Promise<void> {
            throw new Error()
        }

        async on_finish<T>(context: TaskContext<any>, res: T): Promise<void> {
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
    })
})
