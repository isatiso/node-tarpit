/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import chai_spies from 'chai-spies'
import { Cron } from '../src'

chai.use(chai_spies)

describe('normal case', function() {

    it('should generate date object according to "15 * * * *"', function() {
        chai.spy.on(Date, 'now', () => 1658328606790)
        const cron = Cron.parse('15 * * * *', { tz: 'Asia/Shanghai' })
        expect(cron.next().format()).to.equal('2022-07-20T23:15:00.000+08:00')
        expect(cron.next().format()).to.equal('2022-07-21T00:15:00.000+08:00')
        expect(cron.next().format()).to.equal('2022-07-21T01:15:00.000+08:00')
    })
})
