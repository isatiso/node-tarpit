/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '@tarpit/core'

@TpService()
export class TpThreadStrategy {

    public readonly max_threads: number = 4
    public readonly worker_entry = require?.main?.filename ?? ''

    constructor() {
    }
}
