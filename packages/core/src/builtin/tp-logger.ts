/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData } from '@tarpit/config'
import { Inject } from '../annotations'

export abstract class TpLogger {

    abstract after_start(): void

    abstract after_destroy(): void
}

export class BuiltinTpLogger extends TpLogger {

    constructor(
        config_data: ConfigData,
        @Inject('œœ-TpStartedAt') start_at: number
    ) {
        super()
    }

    after_start() {
        console.log(`tp server started at ${new Date().toISOString()}`)
    }

    after_destroy() {
        console.log(`tp server destroyed at ${new Date().toISOString()}`)
    }
}
