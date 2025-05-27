/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '@tarpit/core'
import mime_types from 'mime-types'
import { Readable } from 'stream'
import { parse_content_type } from '../tools/parse-content-type'
import { MIMEContent } from '../types'
import { ContentDecompressorService } from './content-decompressor.service'
import { ContentDeserializerService } from './content-deserializer.service'

export function get_default_charset(content_type: string | undefined) {
    return (content_type && mime_types.charset(content_type) || undefined)?.toLowerCase()
}

export type ParseContentOptions = {
    content_encoding: string
    content_type: string
    skip_deserialize?: boolean
}

@TpService({ inject_root: true })
export class ContentReaderService {

    constructor(
        private decompressor: ContentDecompressorService,
        private deserializer: ContentDeserializerService,
    ) {
    }

    async read(raw: Readable | Buffer, options: ParseContentOptions): Promise<MIMEContent<any>> {
        const buffer = await this.decompressor.decompress(raw, options)
        const content: MIMEContent<any> = {
            ...parse_content_type(options.content_type),
            charset: undefined,
            raw: buffer,
        }
        content.charset = content.parameters.charset ?? get_default_charset(content.type)
        if (content.type && !options.skip_deserialize) {
            await this.deserializer.deserialize(content)
        }
        return content
    }

    async deserialize(content: MIMEContent<any>): Promise<any> {
        return this.deserializer.deserialize(content)
    }
}
