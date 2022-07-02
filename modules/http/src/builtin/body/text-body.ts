/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import iconv from 'iconv-lite'
import { StandardError } from '../../errors'
import { TpRequest } from '../tp-request'

export class TextBody extends String {

    static parse(request: TpRequest, buf: Buffer) {
        const charset = request.charset || 'utf-8'
        if (!iconv.encodingExists(charset)) {
            throw new StandardError(415, 'specified charset unsupported',
                { detail: { type: 'charset.unsupported', charset } })
        }
        return iconv.decode(buf, charset)
    }
}
