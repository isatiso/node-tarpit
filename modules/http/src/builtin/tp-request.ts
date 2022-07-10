/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpConfigSchema } from '@tarpit/config'
import { IncomingHttpHeaders, IncomingMessage } from 'http'
import net from 'net'
import { ParsedUrlQuery } from 'querystring'
import tls from 'tls'
import type_is from 'type-is'
import { UrlWithParsedQuery } from 'url'
import { AcceptParser } from '../tools/accept-parser'

export class TpRequest {

    type: string | undefined
    charset: string | undefined

    constructor(
        public readonly req: IncomingMessage,
        private readonly _url: UrlWithParsedQuery,
        private proxy: TpConfigSchema['http']['proxy'],
    ) {
    }

    get href() {
        return this._url.href
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

    get protocol() {
        return this._url.protocol
    }

    get secure() {
        return this.protocol === 'https'
    }

    get origin() {
        return `${this.protocol}://${this.host}`
    }

    private _ips: string[] | undefined
    get ips() {
        if (!this._ips) {
            const proxy = this.proxy
            const header = this.proxy?.ip_header ?? 'X-Forwarded-For'
            const max_ips_count = this.proxy?.max_ips_count ?? 0
            let val = this.get(header)
            if (Array.isArray(val)) {
                val = val[0]
            }
            let ips = proxy && val ? val.split(/\s*,\s*/) : []
            if (max_ips_count > 0) {
                this._ips = ips.slice(-max_ips_count)
            }
            this._ips = this._ips ?? []
        }
        return this._ips
    }

    get ip() {
        return this.ips[0]
    }

    get headers() {
        return this.req.headers
    }

    get url() {
        return this.req.url
    }

    get method() {
        return this.req.method
    }

    get socket(): (net.Socket & { encrypted: undefined }) | tls.TLSSocket {
        return this.req.socket as any
    }

    get length(): number | undefined {
        const len = this.get('Content-Length')
        return len ? +len : undefined
    }

    private _accepts?: AcceptParser
    get accepts() {
        if (!this._accepts) {
            this._accepts = new AcceptParser(this.req)
        }
        return this._accepts
    }

    is(type: string, ...types: string[]) {
        return type_is(this.req, type, ...types)
    }

    is_idempotent() {
        const methods = ['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS', 'TRACE']
        return !!~methods.indexOf(this.req.method!)
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
}
