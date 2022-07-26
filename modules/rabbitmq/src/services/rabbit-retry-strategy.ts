/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '@tarpit/core'

@TpService({ inject_root: true })
export class RabbitRetryStrategy {

    max_retries = 5

    async on_failed(err: any): Promise<void> {
        throw err
    }
}
