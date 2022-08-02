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
export class TpLogger {

    constructor(
        private injector: Injector,
    ) {
        injector.on('start-time', duration => this.after_start(duration))
        injector.on('terminate-time', duration => this.after_terminate(duration))
    }

    after_start(duration: number) {
        console.log(`Tarpit server started at ${new Date().toISOString()}, during ${duration}s`)
    }

    after_terminate(duration: number) {
        console.log(`Tarpit server destroyed at ${new Date().toISOString()}, during ${duration}s`)
    }
}
