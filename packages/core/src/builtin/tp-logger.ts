/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '../annotations'
import { Injector } from '../di'

export abstract class TpLogger {

    protected constructor(injector: Injector) {
        injector.on('start-time', duration => this.after_start(duration))
        injector.on('terminate-time', duration => this.after_terminate(duration))
    }

    abstract after_start(duration: number): void

    abstract after_terminate(duration: number): void

}

@TpService()
export class BuiltinTpLogger extends TpLogger {

    constructor(
        private injector: Injector,
    ) {
        super(injector)
    }

    after_start(duration: number) {
        console.log(`tarpit server started at ${new Date().toISOString()}, during ${duration}s`)
    }

    after_terminate(duration: number) {
        console.log(`tarpit server destroyed at ${new Date().toISOString()}, during ${duration}s`)
    }
}
