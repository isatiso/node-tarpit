/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Injector } from '@tarpit/core'
import { TpError } from '@tarpit/error'
import { Readable, Transform } from 'stream'
import { decompressor_token } from '../tokens'
import { filter_provider } from '../tools/filter-provider'
import { ParseContentOptions } from '../types'

export class ContentDecompressorService {

    private _decompressor = new Map<string, (req: Readable) => Readable>()

    constructor(
        private injector: Injector,
    ) {
        this.injector.on('provider-change', token => {
            if (token === decompressor_token) {
                this.load_decompressor()
            }
        })
        this.load_decompressor()
    }

    async decompress(raw: Readable | Buffer, options: ParseContentOptions): Promise<Buffer> {
        let received = 0
        const content_encoding = options.content_encoding
        const max_length = options.max_byte_length
        const count_received = new Transform({
            transform(chunk, encoding, callback) {
                received += chunk.length
                callback(null, chunk)
            }
        })

        let stream = Buffer.isBuffer(raw) ? Readable.from(raw) : raw
        stream = stream.pipe(count_received)
        if (content_encoding.indexOf(',') !== -1) {
            for (const encoding of content_encoding.split(',').reverse()) {
                stream = this._decompressor.get(encoding)?.(stream) ?? stream
            }
        } else {
            stream = this._decompressor.get(content_encoding)?.(stream) ?? stream
        }

        return new Promise<Buffer>((resolve, reject) => {
            const buffers: Buffer[] = []
            let finished = false

            stream.on('end', () => finish(Buffer.concat(buffers)))
            stream.on('error', err => finish(err))
            stream.on('data', chunk => {
                if (max_length && received > max_length) {
                    return finish(new TpError({ code: 413, msg: 'Input is too large', detail: { type: 'entity.too.large', max_length, received } }))
                }
                buffers.push(chunk)
            })
            stream.on('close', () => !finished && finish(new TpError({
                code: 'Unexpected Close',
                msg: 'Accept close event before end',
                detail: { type: 'entity.too.large', max_length, received }
            })))

            function finish(value: Error | Buffer) {
                if (!finished) {
                    finished = true
                    stream.removeAllListeners()
                    return Buffer.isBuffer(value) ? resolve(value) : reject(value)
                }
            }
        })
    }

    private load_decompressor() {
        filter_provider(this.injector.get(decompressor_token)?.create())
            .forEach(([key, func]) => this._decompressor.set(key.toLowerCase(), func as any))
    }
}
