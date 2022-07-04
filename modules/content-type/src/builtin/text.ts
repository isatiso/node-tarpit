/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { MIMEContent } from '../types'
import { decode } from './common'

export const text_deserialize = (content: MIMEContent<any>) => {
    return content.text = decode(content.raw, content.charset ?? 'utf-8')
}
