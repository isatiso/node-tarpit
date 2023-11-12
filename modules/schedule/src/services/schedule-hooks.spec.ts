/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Dora } from '@tarpit/dora'
import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import chai_spies from 'chai-spies'
import { Bullet } from '../builtin/bullet'
import { TaskContext } from '../builtin/task-context'
import { TaskCrash, TaskIgnore, TaskRetry } from '../errors'
import { TaskUnit } from '../tools/collect-tasks'
import { assemble_duration, create_log, ScheduleHooks } from './schedule-hooks'

chai.use(cap)
chai.use(chai_spies)

describe('schedule-hooks.ts', function() {

    function mock() {
        const context = TaskContext.from<{ process_start: number }>({
            id: 'bullet-1',
            unit: { task_name: 'task name whatever some' } as TaskUnit,
            execution: Dora.from([2022, 6, 1, 13, 24, 56], { timezone: 'Asia/Shanghai' })
        } as Bullet)
        const spy_get = chai.spy.on(context, 'get')
        const spy_set = chai.spy.on(context, 'set')
        return { context, spy_get, spy_set }
    }

    function redo_spy_console() {
        sandbox.restore()
        sandbox.on(console, ['debug', 'log', 'info', 'warn', 'error'], () => undefined)
    }

    const fake_now = 1658395732508
    const time_str = new Dora(fake_now).format('YYYY-MM-DDTHH:mm:ssZZ')

    const sandbox = chai.spy.sandbox()

    before(async function() {
        sandbox.on(console, ['debug', 'log', 'info', 'warn', 'error'], () => undefined)
    })

    after(async function() {
        sandbox.restore()
    })

    beforeEach(function() {
        chai.spy.on(Date, 'now', () => fake_now)
        redo_spy_console()
    })

    afterEach(function() {
        chai.spy.restore(Date)
    })

    describe('#assemble_duration()', function() {

        it('should get start time from context and figure out duration and return it', function() {
            const { context, spy_get } = mock()
            context.set('process_start', fake_now - 1000)
            expect(assemble_duration(context)).to.equal(1000)
            expect(spy_get).to.have.been.called.with('process_start')
        })

        it('should set -1 to response header X-Duration if process_start not exists', function() {
            const { context, spy_get } = mock()
            expect(assemble_duration(context)).to.equal(-1)
            expect(spy_get).to.have.been.called.with('process_start')
        })
    })

    describe('#create_log()', function() {

        it('should create log message with task name', function() {
            const mock_context = { unit: { task_name: 'task name whatever some' } }
            create_log(mock_context as any, 996)
            expect(console.info).to.have.been.first.called.with(`[${time_str}]        996ms success  `, 'task name whatever some')
        })

        it('should log detail of TaskRetry', function() {
            const mock_context = { unit: { task_name: 'task name whatever some' }, count: 3 }
            const err = new TaskRetry(6, 'resource not exists')
            create_log(mock_context as any, 996, err as any)
            expect(console.info).to.have.been.first.called.with(`[${time_str}]        996ms retry    `, 'task name whatever some', '<ERR.Retry try again, failed 3 times>')
        })

        it('should log detail of TaskCrash', function() {
            const mock_context = { unit: { task_name: 'task name whatever some' } }
            const err = new TaskCrash('ERR.Crash', 'pipe is broken')
            create_log(mock_context as any, 996, err)
            expect(console.error).to.have.been.first.called.with(`[${time_str}]        996ms crash    `, 'task name whatever some', '<ERR.Crash pipe is broken>')
        })

        it('should log detail of TaskIgnore', function() {
            const mock_context = { unit: { task_name: 'task name whatever some' } }
            const err = new TaskIgnore({ msg: 'something not important wrong' })
            create_log(mock_context as any, 996, err)
            expect(console.info).to.have.been.first.called.with(`[${time_str}]        996ms ignore   `, 'task name whatever some', '<ERR.Ignore something not important wrong>')
        })
    })

    describe('ScheduleHooks', function() {

        describe('.on_init()', function() {

            it('should set process_start to context', async function() {
                const { context, spy_set } = mock()
                await new ScheduleHooks().on_init(context)
                expect(spy_set).to.have.been.called.with('process_start', fake_now)
            })
        })

        describe('.on_finish()', function() {

            it('should create log', async function() {
                const { context } = mock()
                context.set('process_start', fake_now - 996)
                await new ScheduleHooks().on_finish(context, null as any)
                expect(console.info).to.have.been.first.called.with(`[${time_str}]        996ms success  `, 'task name whatever some')
            })
        })

        describe('.on_error()', function() {

            it('should create log', async function() {
                const { context } = mock()
                context.set('process_start', fake_now - 996)
                const err = new TaskCrash('ERR.Crash', 'pipe is broken')
                await new ScheduleHooks().on_error(context, err)
                expect(console.error).to.have.been.first.called.with(`[${time_str}]        996ms crash    `, 'task name whatever some', '<ERR.Crash pipe is broken>')
            })
        })
    })
})
