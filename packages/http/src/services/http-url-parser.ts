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
import { TLSSocket } from 'tls'
import url, { UrlWithParsedQuery } from 'url'

@TpService()
export class HttpUrlParser {

    private proxy_config = this.config_data.get('http.proxy')

    constructor(
        private config_data: ConfigData,
    ) {
    }

    parse(req: IncomingMessage): UrlWithParsedQuery | undefined {
        try {
            const req_url = req.url ?? '/'
            if (/^https?:\/\//i.test(req_url)) {
                return url.parse(req_url, true)
            } else {
                return url.parse(this.figure_origin(req) + req_url, true)
            }
        } catch (e: any) {
            return
        }
    }

    private figure_origin(req: IncomingMessage) {
        return `${this.figure_protocol(req)}://${this.figure_host(req)}`
    }

    private figure_protocol(req: IncomingMessage) {
        if ((req.socket as TLSSocket).encrypted) {
            return 'https'
        }
        if (!this.proxy_config?.enable) {
            return 'http'
        }
        let proto = req.headers['x-forwarded-proto']
        if (Array.isArray(proto)) {
            proto = proto[0]
        }
        return proto ? proto.split(/\s*,\s*/, 1)[0] : 'http'
    }

    private figure_host(req: IncomingMessage): string {
        let host = this.proxy_config?.enable ? req.headers['x-forwarded-host'] as string : ''
        if (!host) {
            if (req.httpVersionMajor >= 2) {
                host = req.headers[':authority'] as string ?? ''
            }
            if (!host) {
                host = req.headers['host'] as string ?? ''
            }
        }
        if (!host) {
            return ''
        }
        return host.split(/\s*,\s*/, 1)[0]
    }
}
