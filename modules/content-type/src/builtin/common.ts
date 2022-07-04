/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import iconv from 'iconv-lite'

export function decode(buffer: Buffer, charset: string | null): string | undefined {
    return charset && iconv.encodingExists(charset) ? iconv.decode(buffer, charset) : undefined
}
