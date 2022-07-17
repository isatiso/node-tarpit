/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { url_encode } from '../tools/urlencode'
import { MIMEContent } from '../types'
import { decode } from './common'

export const form_deserialize = (content: MIMEContent<any>): any => {
    const charset = content.charset ?? 'utf-8'
    content.text = decode(content.raw, charset)
    if (!content.text) {
        return
    }
    return content.data = url_encode.parse(content.text, { charset })
}

