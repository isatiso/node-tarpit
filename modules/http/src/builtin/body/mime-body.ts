/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { MIMEContent } from '@tarpit/content-type'
import { JsonBody } from './json-body'

export class MimeBody<T> {

    type: string | undefined
    charset: string | undefined
    raw: Buffer
    text?: string
    data?: T

    checker?: JsonBody<T>

    constructor(content: MIMEContent<any>) {
        this.type = content.type
        this.charset = content.charset
        this.raw = content.raw
        this.text = content.text
        this.data = content.data
        if (Object.prototype.toString.call(this.data) === '[object Object]') {
            this.checker = new JsonBody<T>(this.data)
        }
    }
}
