/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { MIMEContent } from '@tarpit/content-type'

export class RawBody extends Buffer {
    constructor(content: MIMEContent<any>) {
        super(content.raw)
    }
}
