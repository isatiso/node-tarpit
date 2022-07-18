/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { SymbolToken, TpService } from '@tarpit/core'
import { TaskHub } from './task-hub'

@SymbolToken('schedule')
@TpService({ inject_root: true })
export class Schedule {

    private _interval: NodeJS.Timeout | undefined

    constructor(
        private task_hub: TaskHub,
    ) {
    }

    async start(): Promise<void> {
        this._interval = setInterval(() => this.task_hub.shoot(Date.now()), 100)
    }

    async terminate() {
        if (this._interval) {
            clearInterval(this._interval)
        }
    }
}
