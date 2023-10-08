/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

// istanbul ignore file

import { TpService } from '../annotations'

@TpService()
export class TpThreadStrategy {
    public readonly max_threads = 4
}
