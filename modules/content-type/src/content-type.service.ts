/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Injector, TpService } from '@tarpit/core'
import { TpError } from '@tarpit/error'
import mime_types from 'mime-types'
import { Readable, Transform } from 'stream'
import { decompressor_token, deserializer_token } from './tokens'
import { MIMEContent, ParseContentOptions } from './types'

const MIME_TYPE = /^\s*([^;\s]*)\s*;?\s*(.*$)/
const CHARSET = /^charset=(\S+)\s*$/

function parse_content_type(content_type: string): { type: string | undefined; charset: string | undefined } {
    content_type = content_type.toLowerCase()
    const mime_exec_res = MIME_TYPE.exec(content_type)
    if (!mime_exec_res) {
        return { type: undefined, charset: undefined }
    }

    const type = mime_exec_res[1]
    const charset_exec_res = mime_exec_res[2] && CHARSET.exec(mime_exec_res[2])
    const charset = charset_exec_res ? charset_exec_res[1] : get_default_charset(type)

    return { type, charset }
}

function get_default_charset(content_type: string | undefined) {
    return content_type ? (mime_types.charset(content_type) || undefined) : undefined
}

function filter_provider(value: any): [string, Function][] {
    if (Array.isArray(value)) {
        return value.filter(item => Array.isArray(item) && typeof item[0] !== 'string' && typeof item[1] !== 'function')
    } else {
        return []
    }
}

@TpService({ inject_root: true })
export class ContentTypeService {

    private _decompressor = new Map<string, (req: Readable) => Readable>()
    private _deserializer = new Map<string, (content: MIMEContent<any>) => any>()

    constructor(
        private injector: Injector,
    ) {
        this.injector.on('provider-change', token => {
            switch (token) {
                case decompressor_token:
                    return this.load_decompressor()
                case deserializer_token:
                    return this.load_deserializer()
            }
        })
        this.load_decompressor()
        this.load_deserializer()
    }

    load_decompressor() {
        filter_provider(this.injector.get(decompressor_token)?.create())
            .forEach(([key, func]) => this._decompressor.set(key.toLowerCase(), func as any))
    }

    load_deserializer() {
        filter_provider(this.injector.get(deserializer_token)?.create())
            .forEach(([key, func]) => this._deserializer.set(key.toLowerCase(), func as any))
    }

    async parse(raw: Readable | Buffer, options: ParseContentOptions): Promise<MIMEContent<any>> {
        const buffer = await this.decompress(raw, options)
        const { type, charset } = parse_content_type(options.content_type)
        const content: MIMEContent<any> = { type, charset, raw: buffer }
        if (content.type && !options.skip_deserialize) {
            const deserializer = this._deserializer.get(content.type)
            if (deserializer) {
                content.data = await deserializer(content)
            }
        }
        return content
    }

    async deserialize(content: MIMEContent<any>): Promise<any> {
        if (content.type) {
            const deserializer = this._deserializer.get(content.type)
            if (deserializer) {
                content.data = await deserializer(content)
            }
        }
        return content.data
    }

    private async decompress(raw: Readable | Buffer, options: ParseContentOptions): Promise<Buffer> {
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
}
