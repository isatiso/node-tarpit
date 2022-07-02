/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData } from '@tarpit/config'
import { TpService } from '@tarpit/core'
import { IncomingMessage } from 'http'
import { Transform } from 'stream'
import { StandardError } from '../errors'
import { AbstractHttpDecompressor } from './inner/abstract-http-decompressor'

@TpService({ inject_root: true })
export class HttpBodyReader {

    private max_length = this.config_data.get('http.body.max_length') ?? 0

    constructor(
        private decompressor: AbstractHttpDecompressor,
        private config_data: ConfigData,
    ) {
    }

    async read(req: IncomingMessage): Promise<Buffer> {

        let received = 0
        const max_length = this.max_length
        const content_encoding = req.headers['content-encoding'] || 'identity'
        const content_length = req.headers['content-length'] ? +req.headers['content-length'] : undefined
        if (max_length && content_length && content_encoding === 'identity' && content_length > max_length) {
            throw new StandardError(413, 'Request entity too large', { detail: { content_length, max_length } })
        }

        const count_received = new Transform({
            transform(chunk, encoding, callback) {
                received += chunk.length
                callback(null, chunk)
            }
        })

        const stream = this.decompressor.decompress(req.pipe(count_received), content_encoding)
        if (!stream.readable) {
            throw new StandardError(500, 'Stream is not readable', { detail: { type: 'stream.not.readable' } })
        }

        return new Promise((resolve, reject) => {

            let buffers: Buffer[] = []
            let finished = false

            stream.on('aborted', on_close)
            stream.on('close', on_close)
            stream.on('error', on_error)
            stream.on('data', on_data)
            stream.on('end', on_end)

            function cleanup() {
                stream.removeListener('aborted', on_close)
                stream.removeListener('close', on_close)
                stream.removeListener('data', on_data)
                stream.removeListener('end', on_end)
                stream.removeListener('error', on_error)
            }

            function finish(value: Error | Buffer) {
                if (finished) {
                    return
                }
                finished = true
                cleanup()
                return value instanceof Error ? reject(value) : resolve(value)
            }

            function on_close() {
                if (!finished) {
                    return finish(new StandardError(400, 'Request aborted',
                        { detail: { type: 'request.aborted', code: 'ECONNABORTED', content_length, received } }))
                }
            }

            function on_data(chunk: Buffer) {
                if (max_length && received > max_length) {
                    return finish(new StandardError(413, 'Request entity too large',
                        { detail: { type: 'entity.too.large', max_length, received } }))
                }
                buffers.push(chunk)
            }

            function on_error(err: any) {
                return finish(new StandardError(500, err.message, { origin: err }))
            }

            function on_end() {
                if (content_length && received !== content_length) {
                    return finish(new StandardError(400, 'Request size did not match content length',
                        { detail: { type: 'request.size.invalid', content_length, received } }))
                }
                return finish(Buffer.concat(buffers))
            }
        })
    }
}
