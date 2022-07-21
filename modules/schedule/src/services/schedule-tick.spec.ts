/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import chai_spies from 'chai-spies'
import { ScheduleHub } from './schedule-hub'
import { ScheduleTick } from './schedule-tick'

chai.use(chai_spies)

describe('schedule-tick.ts', function() {

    describe('ScheduleTick', function() {

        it('should start', async function() {
            const mock_hub = {} as ScheduleHub
            const spy_shoot = chai.spy.on(mock_hub, 'shoot', () => undefined)
            chai.spy.on(Date, 'now', () => 1658395368765)
            const tick = new ScheduleTick(mock_hub)
            await tick.start()
            await new Promise(resolve => setTimeout(() => resolve(null), 450))
            await tick.terminate()
            expect(spy_shoot).to.have.been.called.exactly(4)
            expect(spy_shoot).to.have.been.called.always.with(1658395368765)
            chai.spy.restore(Date)
        })
    })
})
