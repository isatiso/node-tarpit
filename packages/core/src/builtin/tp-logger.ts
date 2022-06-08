/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData } from '@tarpit/config'
import { TpService } from '../annotations'
import { Injector } from '../injector'
import { START_TIME, TERMINATE_TIME } from './tp-inspector'

export abstract class TpLogger {

    abstract after_start(): void

    abstract after_destroy(): void
}

@TpService()
export class BuiltinTpLogger extends TpLogger {

    constructor(
        private config_data: ConfigData,
        private injector: Injector,
    ) {
        super()
    }

    after_start() {
        const duration = this.injector.get<number>(START_TIME)?.create()
        console.log(`tarpit server started at ${new Date().toISOString()}, during ${duration}s`)
    }

    after_destroy() {
        const duration = this.injector.get<number>(TERMINATE_TIME)?.create()
        console.log(`tarpit server destroyed at ${new Date().toISOString()}, during ${duration}s`)
    }
}
