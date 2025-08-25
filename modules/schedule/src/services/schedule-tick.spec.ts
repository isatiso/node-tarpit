/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { describe, it, expect, vi } from 'vitest'
import { ScheduleHub } from './schedule-hub'
import { ScheduleTick } from './schedule-tick'

describe('schedule-tick.ts', function() {

    describe('ScheduleTick', function() {

        it('should start', async function() {
            const mock_hub = { shoot: () => {} } as ScheduleHub
            const spy_shoot = vi.spyOn(mock_hub, 'shoot')
            vi.spyOn(Date, 'now').mockImplementation(() => 1658395368765)
            const tick = new ScheduleTick(mock_hub)
            await tick.start()
            await new Promise(resolve => setTimeout(() => resolve(null), 450))
            await tick.terminate()
            expect(spy_shoot).toHaveBeenCalledTimes(4)
            expect(spy_shoot).toHaveBeenCalledWith(1658395368765)
            vi.restoreAllMocks()
        })
    })
})
