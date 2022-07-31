/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '../annotations'
import { Injector } from '../di'

@TpService()
export class TpInspector {

    private _started = false
    private _terminated = false

    constructor(
        private injector: Injector
    ) {
        this.injector.on('start', () => {
            this._started_at = Date.now()
        })
        this.injector.on('start-time', duration => {
            this._started = true
            this._start_time = duration
        })
        this.injector.on('terminate', () => {
            this._terminated_at = Date.now()
        })
        this.injector.on('terminate-time', duration => {
            this._terminated = true
            this._terminate_time = duration
        })
    }

    private _started_at = -1

    get started_at(): number {
        return this._started_at
    }

    private _terminated_at = -1

    get terminated_at(): number {
        return this._terminated_at
    }

    private _start_time = -1

    get start_time(): number {
        return this._start_time
    }

    private _terminate_time = -1
    get terminate_time(): number {
        return this._terminate_time
    }

    async wait_start(): Promise<number> {
        return new Promise(resolve => {
            if (this._started) {
                resolve(this._start_time)
            } else {
                this.injector.once('start-time', (duration) => resolve(duration))
            }
        })
    }

    async wait_terminate(): Promise<number> {
        return new Promise(resolve => {
            if (this._terminated) {
                resolve(this._terminate_time)
            } else {
                this.injector.once('terminate-time', (duration) => resolve(duration))
            }
        })
    }
}
