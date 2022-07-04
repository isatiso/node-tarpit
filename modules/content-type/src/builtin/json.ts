/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { MIMEContent } from '../types'
import { decode } from './common'

export const json_deserialize = <T>(content: MIMEContent<T>): T | undefined => {
    content.text = decode(content.raw, content.charset ?? 'utf-8')
    try {
        return content.text && JSON.parse(content.text)
    } catch (e) {
        return
    }
}
