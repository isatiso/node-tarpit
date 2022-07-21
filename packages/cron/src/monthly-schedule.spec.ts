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
import { MonthlySchedule } from './monthly-schedule'

chai.use(cap)
chai.use(chai_spies)

describe('monthly-schedule.ts', function() {

    describe('MonthlySchedule', function() {

        it('should tick tock to the end', function() {
            const schedule = new MonthlySchedule(2022, 11, Dora.from([2022, 11, 1, 0, 0, 0]), 'Asia/Shanghai', [[15, 30], [8, 20], [15, 45], [0, 30]])
            expect(schedule.next()?.format()).to.equal('2022-12-15T08:15:00.000+08:00')
            expect(schedule.next()?.format()).to.equal('2022-12-15T08:15:30.000+08:00')
            expect(schedule.next()?.format()).to.equal('2022-12-15T08:45:00.000+08:00')
            expect(schedule.next()?.format()).to.equal('2022-12-15T08:45:30.000+08:00')
            expect(schedule.next()?.format()).to.equal('2022-12-15T20:15:00.000+08:00')
            expect(schedule.next()?.format()).to.equal('2022-12-15T20:15:30.000+08:00')
            expect(schedule.next()?.format()).to.equal('2022-12-15T20:45:00.000+08:00')
            expect(schedule.next()?.format()).to.equal('2022-12-15T20:45:30.000+08:00')
            expect(schedule.next()?.format()).to.equal('2022-12-30T08:15:00.000+08:00')
            expect(schedule.next()?.format()).to.equal('2022-12-30T08:15:30.000+08:00')
            expect(schedule.next()?.format()).to.equal('2022-12-30T08:45:00.000+08:00')
            expect(schedule.next()?.format()).to.equal('2022-12-30T08:45:30.000+08:00')
            expect(schedule.next()?.format()).to.equal('2022-12-30T20:15:00.000+08:00')
            expect(schedule.next()?.format()).to.equal('2022-12-30T20:15:30.000+08:00')
            expect(schedule.next()?.format()).to.equal('2022-12-30T20:45:00.000+08:00')
            expect(schedule.next()?.format()).to.equal('2022-12-30T20:45:30.000+08:00')
            expect(schedule.next()).to.be.undefined
        })
    })
})
