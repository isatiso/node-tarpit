/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData } from '@tarpit/config'
import { ContentTypeService, MIMEContent } from '@tarpit/content-type'
import { TpService } from '@tarpit/core'
import { IncomingMessage } from 'http'
import { StandardError } from '../errors'

@TpService({ inject_root: true })
export class HttpBodyReader {

    private max_length = this.config_data.get('http.body.max_length') ?? 0

    constructor(
        private config_data: ConfigData,
        private content_type: ContentTypeService,
    ) {
    }

    async read(req: IncomingMessage, content_type?: string): Promise<MIMEContent<any>> {

        content_type = content_type || req.headers['content-type'] || ''
        const content_encoding = req.headers['content-encoding'] || 'identity'
        const content_length = req.headers['content-length'] ? +req.headers['content-length'] : undefined

        if (this.max_length && content_length && content_encoding === 'identity' && content_length > this.max_length) {
            throw new StandardError(413, 'Request entity too large', { detail: { content_length, max_length: this.max_length } })
        }

        return this.content_type.parse(req, { content_encoding, content_type, skip_deserialize: true, max_byte_length: this.max_length })
    }
}
