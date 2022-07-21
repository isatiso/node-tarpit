/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '@tarpit/core'
import { ScheduleHub } from './schedule-hub'

@TpService({ inject_root: true })
export class ScheduleTick {

    private _interval: NodeJS.Timeout | undefined

    constructor(
        private hub: ScheduleHub,
    ) {
    }

    async start(): Promise<void> {
        this._interval = setInterval(() => this.hub.shoot(Date.now()), 100)
    }

    async terminate() {
        this._interval && clearInterval(this._interval)
    }
}
