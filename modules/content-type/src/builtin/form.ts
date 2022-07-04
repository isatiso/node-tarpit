/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { MIMEContent } from '../types'
import { decode } from './common'

export const form_deserialize = (content: MIMEContent<any>): any => {
    content.text = decode(content.raw, content.charset ?? 'utf-8')
    if (!content.text) {
        return
    }
    const params: any = {}
    new URLSearchParams(content.text).forEach((value, key) => {
        if (params[key] === undefined) {
            params[key] = value
        } else if (typeof params[key] === 'string') {
            params[key] = [params[key], value]
        } else {
            params[key].push(value)
        }
    })
    return params
}
