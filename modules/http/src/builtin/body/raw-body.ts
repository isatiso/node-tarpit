/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpRequest } from '../tp-request'

export class RawBody extends Buffer {

    static parse(request: TpRequest, buf: Buffer) {
        return buf
    }
}
