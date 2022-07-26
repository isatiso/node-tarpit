/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

export function narrow_to_buffer(message: string | object | Buffer): Buffer {
    if (Buffer.isBuffer(message)) {
        return message
    } else if (typeof message === 'string') {
        return Buffer.from(message)
    } else {
        return Buffer.from(JSON.stringify(message))
    }
}
