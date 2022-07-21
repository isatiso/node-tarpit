/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import chai_spies from 'chai-spies'
import { Cron } from './cron'

chai.use(cap)
chai.use(chai_spies)

describe('cron.ts', function() {

    describe('Cron', function() {

        describe('#parse()', function() {

            it('should parse expression and create instance of Cron', function() {
                const cron = Cron.parse('15 * * * *')
                expect(cron).to.be.instanceof(Cron)
            })
        })

        describe('.next()', function() {

            afterEach(function() {
                chai.spy.restore(Date)
            })

            it('should generate date object according to "15 * * * *"', function() {
                chai.spy.on(Date, 'now', () => 1658328606790)
                const cron = Cron.parse('15 * * * *')
                expect(cron.next().format()).to.equal('2022-07-20T23:15:00.000+08:00')
                expect(cron.next().format()).to.equal('2022-07-21T00:15:00.000+08:00')
                expect(cron.next().format()).to.equal('2022-07-21T01:15:00.000+08:00')
            })

            it('should generate date object according to "@monthly"', function() {
                chai.spy.on(Date, 'now', () => 1658328606790)
                const cron = Cron.parse('@monthly')
                expect(cron.next().format()).to.equal('2022-08-01T00:00:00.000+08:00')
                expect(cron.next().format()).to.equal('2022-09-01T00:00:00.000+08:00')
                expect(cron.next().format()).to.equal('2022-10-01T00:00:00.000+08:00')
                expect(cron.next().format()).to.equal('2022-11-01T00:00:00.000+08:00')
                expect(cron.next().format()).to.equal('2022-12-01T00:00:00.000+08:00')
                expect(cron.next().format()).to.equal('2023-01-01T00:00:00.000+08:00')
            })

            it('should generate date object according to "15 6 l * *"', function() {
                chai.spy.on(Date, 'now', () => 1658328606790)
                const cron = Cron.parse('15 6 l * *')
                expect(cron.next().format()).to.equal('2022-07-31T06:15:00.000+08:00')
                expect(cron.next().format()).to.equal('2022-08-31T06:15:00.000+08:00')
                expect(cron.next().format()).to.equal('2022-09-30T06:15:00.000+08:00')
                expect(cron.next().format()).to.equal('2022-10-31T06:15:00.000+08:00')
                expect(cron.next().format()).to.equal('2022-11-30T06:15:00.000+08:00')
            })

            it('should generate date object according to "*/30 * * OCT-DEC FRI"', function() {
                chai.spy.on(Date, 'now', () => 1658828606790)
                const cron = Cron.parse('*/30 * * OCT-DEC FRI')
                expect(cron.next().format()).to.equal('2022-10-28T00:00:00.000+08:00')
                expect(cron.next().format()).to.equal('2022-10-28T00:30:00.000+08:00')
                expect(cron.next().format()).to.equal('2022-10-28T01:00:00.000+08:00')
                expect(cron.next().format()).to.equal('2022-10-28T01:30:00.000+08:00')
            })

            it('should generate date object according to "10 6 1w,5w,6w,lw,32w * *"', function() {
                chai.spy.on(Date, 'now', () => 1658328606790)
                const cron = Cron.parse('10 6 1w,5w,6w,lw,32w * *')
                expect(cron.next().format()).to.equal('2022-07-29T06:10:00.000+08:00')
                expect(cron.next().format()).to.equal('2022-08-01T06:10:00.000+08:00')
                expect(cron.next().format()).to.equal('2022-08-05T06:10:00.000+08:00')
                expect(cron.next().format()).to.equal('2022-08-31T06:10:00.000+08:00')
                cron.next()
                expect(cron.next().format()).to.equal('2022-09-05T06:10:00.000+08:00')
                cron.next()
                cron.next()
                cron.next()
                cron.next()
                cron.next()
                cron.next()
                cron.next()
                expect(cron.next().format()).to.equal('2022-11-04T06:10:00.000+08:00')
            })

            it('should generate date object according to "45 23 * * 3#4,6#1,5L"', function() {
                chai.spy.on(Date, 'now', () => 1658828606790)
                const cron = Cron.parse('45 23 * * 3#4,6#5,5L')
                expect(cron.next().format()).to.equal('2022-07-27T23:45:00.000+08:00')
                expect(cron.next().format()).to.equal('2022-07-29T23:45:00.000+08:00')
                expect(cron.next().format()).to.equal('2022-07-30T23:45:00.000+08:00')
                expect(cron.next().format()).to.equal('2022-08-24T23:45:00.000+08:00')
                cron.next()
                cron.next()
                cron.next()
                cron.next()
                cron.next()
                cron.next()
                cron.next()
                cron.next()
                expect(cron.next().format()).to.equal('2022-12-28T23:45:00.000+08:00')
            })

            it('should generate date object according to "45 23 * * 3#4,6#1,5L"', function() {
                chai.spy.on(Date, 'now', () => 1658828606790)
                const cron = Cron.parse('15 */4 * * *', { utc: true })
                expect(cron.next().format()).to.equal('2022-07-26T12:15:00.000+00:00')
                expect(cron.next().format()).to.equal('2022-07-26T16:15:00.000+00:00')
                expect(cron.next().format()).to.equal('2022-07-26T20:15:00.000+00:00')
                expect(cron.next().format()).to.equal('2022-07-27T00:15:00.000+00:00')
            })

            it('should generate date object according to "45 23 * * 3#4,6#1,5L"', function() {
                chai.spy.on(Date, 'now', () => 1658828606790)
                const cron = Cron.parse('15 */4 * * *', { tz: 'Europe/London' })
                expect(cron.next().format()).to.equal('2022-07-26T12:15:00.000+01:00')
                expect(cron.next().format()).to.equal('2022-07-26T16:15:00.000+01:00')
                expect(cron.next().format()).to.equal('2022-07-26T20:15:00.000+01:00')
                expect(cron.next().format()).to.equal('2022-07-27T00:15:00.000+01:00')
            })
        })
    })
})
