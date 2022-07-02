/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '@tarpit/core'
import { Readable } from 'stream'
import zlib from 'zlib'
import { AbstractHttpDecompressor } from '../inner/abstract-http-decompressor'

@TpService({ inject_root: true })
export class TpHttpDecompressor extends AbstractHttpDecompressor {

    private decompressors = new Map<string, (req: Readable) => Readable>()

    constructor() {
        super()
        this.decompressors.set('br', req => req.pipe(zlib.createBrotliDecompress()))
        this.decompressors.set('gzip', req => req.pipe(zlib.createGunzip()))
        this.decompressors.set('deflate', req => req.pipe(zlib.createInflate()))
    }

    decompress(req: Readable, content_encoding: string): Readable {
        let stream: Readable = req
        if (content_encoding.indexOf(',') !== -1) {
            for (const encoding of content_encoding.split(',').reverse()) {
                stream = this.decompressors.get(encoding)?.(stream) ?? stream
            }
        } else {
            stream = this.decompressors.get(content_encoding)?.(stream) ?? stream
        }
        return stream
    }
}
