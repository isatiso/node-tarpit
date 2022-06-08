/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Readable } from 'stream'

export abstract class AbstractHttpDecompressor {
    abstract decompress(req: Readable, content_encoding: string): Readable
}
