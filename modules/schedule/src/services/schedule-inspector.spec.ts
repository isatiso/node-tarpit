/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform, TpInspector } from '@tarpit/core'
import chai, { expect } from 'chai'
import chai_spies from 'chai-spies'
import { Task, TpSchedule } from '../annotations'
import { ScheduleModule } from '../schedule.module'
import { ScheduleInspector } from './schedule-inspector'

chai.use(chai_spies)

describe('schedule-inspector.ts', function() {

    describe('ScheduleInspector', function() {

        @TpSchedule({ imports: [ScheduleModule] })
        class TempSchedule {

            @Task('15 6 * * *', '发通知', { tz: 'Asia/Shanghai' })
            async do_something() {
            }

            @Task('15 9 * * *', '发通知', { tz: 'Asia/Shanghai' })
            async do_something_else() {
            }
        }

        let fake_time = 1658395732508
        let platform: Platform
        let inspector: TpInspector
        let schedule_inspector: ScheduleInspector

        const sandbox = chai.spy.sandbox()

        before(function() {
        })

        after(function() {
        })

        before(async function() {
            sandbox.on(console, ['debug', 'log', 'info', 'warn', 'error'], () => undefined)
            chai.spy.on(Date, 'now', () => fake_time)
            platform = new Platform(load_config({})).bootstrap(TempSchedule)
            inspector = platform.expose(TpInspector)!
            schedule_inspector = platform.expose(ScheduleInspector)!
            platform.start()
            await inspector.wait_start()
        })

        after(async function() {
            platform.terminate()
            await inspector.wait_terminate()
            chai.spy.restore(Date)
            sandbox.restore()
        })

        describe('.get_task()', function() {

            it('should get task', async function() {
                expect(schedule_inspector.get_task('bullet-2')).to.eql({
                    crontab: '15 9 * * *',
                    id: 'bullet-2',
                    name: '发通知',
                    next_exec_date_string: '2022-07-22T09:15:00.000+08:00',
                    next_exec_ts: 1658452500000,
                    pos: 'TempSchedule.do_something_else',
                })
            })
        })

        describe('.get_suspended_task()', function() {

            it('should get suspended task', async function() {
                await schedule_inspector.cancel('bullet-2')
                expect(schedule_inspector.get_suspended_task('bullet-2')).to.eql({
                    crontab: '15 9 * * *',
                    id: 'bullet-2',
                    name: '发通知',
                    next_exec_date_string: '2022-07-22T09:15:00.000+08:00',
                    next_exec_ts: 1658452500000,
                    pos: 'TempSchedule.do_something_else',
                })
                await schedule_inspector.reload('bullet-2')
            })

            it('should return undefined if not exists', async function() {
                expect(schedule_inspector.get_suspended_task('bullet-3')).to.be.undefined
            })
        })

        describe('.list_task()', function() {

            it('should list tasks', async function() {
                expect(schedule_inspector.list_task()).to.eql([{
                    crontab: '15 6 * * *',
                    id: 'bullet-1',
                    name: '发通知',
                    next_exec_date_string: '2022-07-22T06:15:00.000+08:00',
                    next_exec_ts: 1658441700000,
                    pos: 'TempSchedule.do_something',
                }, {
                    crontab: '15 9 * * *',
                    id: 'bullet-2',
                    name: '发通知',
                    next_exec_date_string: '2022-07-22T09:15:00.000+08:00',
                    next_exec_ts: 1658452500000,
                    pos: 'TempSchedule.do_something_else',
                }])
            })
        })

        describe('.list_suspended()', function() {

            it('should list suspended tasks', function() {
                expect(schedule_inspector.list_suspended()).to.eql([])
            })
        })

        describe('.cancel()', function() {

            it('should cancel task', async function() {
                await schedule_inspector.cancel('bullet-1')
                expect(schedule_inspector.list_suspended()).to.eql([{
                    crontab: '15 6 * * *',
                    id: 'bullet-1',
                    name: '发通知',
                    next_exec_date_string: '2022-07-22T06:15:00.000+08:00',
                    next_exec_ts: 1658441700000,
                    pos: 'TempSchedule.do_something',
                }])
            })
        })

        describe('.reload()', function() {

            it('should reload task', async function() {
                await schedule_inspector.reload('bullet-1')
                expect(schedule_inspector.list_task()).to.eql([{
                    crontab: '15 6 * * *',
                    id: 'bullet-1',
                    name: '发通知',
                    next_exec_date_string: '2022-07-22T06:15:00.000+08:00',
                    next_exec_ts: 1658441700000,
                    pos: 'TempSchedule.do_something',
                }, {
                    crontab: '15 9 * * *',
                    id: 'bullet-2',
                    name: '发通知',
                    next_exec_date_string: '2022-07-22T09:15:00.000+08:00',
                    next_exec_ts: 1658452500000,
                    pos: 'TempSchedule.do_something_else',
                }])
            })

            it('should run first before reload if given run_first parameter', async function() {
                await schedule_inspector.cancel('bullet-1')
                await schedule_inspector.reload('bullet-1', true)
            })

            it('should do nothing if task is not suspended', async function() {
                await schedule_inspector.reload('bullet-3')
                await schedule_inspector.reload('bullet-3', true)
            })

            it('should sync execution when reload', async function() {
                await schedule_inspector.cancel('bullet-1')
                fake_time = 1668452500000
                await schedule_inspector.reload('bullet-1')
            })
        })

        describe('.run()', function() {

            it('should run task immediately', async function() {
                await schedule_inspector.run('bullet-1')
            })

            it('should do nothing if task is not existed', async function() {
                await schedule_inspector.run('bullet-3')
            })
        })
    })
})
