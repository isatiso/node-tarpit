/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpConfigSchema } from '@tarpit/config'
import accepts from 'accepts'
import content_type from 'content-type'
import { IncomingHttpHeaders, IncomingMessage } from 'http'
import net from 'net'
import { ParsedUrlQuery } from 'querystring'
import tls from 'tls'
import type_is from 'type-is'
import { UrlWithParsedQuery } from 'url'

export interface ContentTypeMedia {
    type?: string
    charset?: string
}

export class TpRequest {

    private _content_type?: ContentTypeMedia

    constructor(
        public readonly req: IncomingMessage,
        private readonly _url: UrlWithParsedQuery,
        private proxy: TpConfigSchema['http']['proxy']
    ) {
    }

    private _accept?: accepts.Accepts

    get accept() {
        return this._accept || (this._accept = accepts(this.req))
    }

    get header() {
        return this.req.headers
    }

    get headers() {
        return this.req.headers
    }

    get url() {
        return this.req.url
    }

    get origin() {
        return `${this.protocol}://${this.host}`
    }

    get href() {
        return this._url.href
    }

    get method() {
        return this.req.method
    }

    get path() {
        return this._url.pathname
    }

    get query(): ParsedUrlQuery {
        return this._url.query
    }

    get query_string(): string {
        return this._url.search?.replace(/^\?/, '') ?? ''
    }

    get search() {
        return this._url.search ?? ''
    }

    get host() {
        return this._url.host
    }

    get hostname() {
        return this._url.hostname
    }

    get socket(): (net.Socket & { encrypted: undefined }) | tls.TLSSocket {
        return this.req.socket as any
    }

    get type() {
        return this.parse_content_type()?.type ?? ''
    }

    get charset() {
        return this.parse_content_type()?.charset ?? ''
    }

    get length(): number | undefined {
        const len = this.get('Content-Length')
        return len ? +len : undefined
    }

    get protocol() {
        return this._url.protocol
    }

    get secure() {
        return this.protocol === 'https'
    }

    get ips() {
        const proxy = this.proxy
        const header = this.proxy?.ip_header ?? 'X-Forwarded-For'
        const max_ips_count = this.proxy?.max_ips_count ?? 0
        let val = this.get(header)
        if (Array.isArray(val)) {
            val = val[0]
        }
        let ips = proxy && val ? val.split(/\s*,\s*/) : []
        if (max_ips_count > 0) {
            ips = ips.slice(-max_ips_count)
        }
        return ips
    }

    get ip() {
        return this.ips[0] || this.socket.remoteAddress || ''
    }

    get idempotent() {
        const methods = ['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS', 'TRACE']
        return !!~methods.indexOf(this.req.method!)
    }

    accepts(...args: string[]) {
        return this.accept.types(...args)
    }

    acceptsEncodings(...args: string[]) {
        return this.accept.encodings(...args)
    }

    acceptsCharsets(...args: string[]) {
        return this.accept.charsets(...args)
    }

    acceptsLanguages(...args: string[]) {
        return this.accept.languages(...args)
    }

    is(type: string, ...types: string[]) {
        return type_is(this.req, type, ...types)
    }

    get<P extends (keyof IncomingHttpHeaders & string)>(field: P): IncomingHttpHeaders[Lowercase<P>] {
        const lower_field = field.toLowerCase()
        switch (lower_field) {
            case 'referer':
            case 'referrer':
                return this.req.headers.referrer || this.req.headers.referer || ''
            default:
                return this.req.headers[lower_field] || ''
        }
    }

    private parse_content_type() {
        if (this._content_type) {
            return this._content_type
        }
        try {
            const { type, parameters } = content_type.parse(this.req)
            return this._content_type = { type, charset: parameters?.charset, }
        } catch (e) {
            const header = this.get('Content-Type')
            if (header) {
                return { type: header.split(';')[0] }
            } else {
                return {}
            }
        }
    }
}
