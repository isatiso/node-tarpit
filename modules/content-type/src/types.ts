/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

export type MIMEContent<T> = {
    type: string | undefined
    charset: string | undefined
    raw: Buffer
    text?: string
    data?: T
}

export type ParseContentOptions = {
    content_encoding: string
    content_type: string
    max_byte_length?: number
    skip_deserialize?: boolean
}
