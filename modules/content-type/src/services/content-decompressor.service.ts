/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Injector, TpService } from '@tarpit/core'
import { PassThrough, Readable } from 'stream'
import { decompressor_token } from '../tokens'
import { filter_provider } from '../tools/filter-provider'
import { readable_to_buffer } from '../tools/readable-to-buffer'

export type DecompressContentOptions = {
    content_encoding: string
}

@TpService({ inject_root: true })
export class ContentDecompressorService {

    private _decompressor = new Map<string, (req: Readable) => Readable>()

    constructor(
        private injector: Injector,
    ) {
        this.injector.on('provider-change', token => token === decompressor_token && this.load_decompressor())
        this.load_decompressor()
    }

    async decompress(raw: Readable | Buffer, options: DecompressContentOptions): Promise<Buffer> {
        const content_encoding = options.content_encoding

        let stream = Buffer.isBuffer(raw) ? Readable.from(raw) : raw
        for (const encoding of content_encoding.split(',').reverse()) {
            stream = this._decompressor.get(encoding)?.(stream) ?? stream.pipe(new PassThrough())
        }
        return readable_to_buffer(stream)
    }

    private load_decompressor() {
        filter_provider(this.injector.get(decompressor_token)!.create())
            .forEach(([key, func]) => this._decompressor.set(key.toLowerCase(), func as any))
    }
}
