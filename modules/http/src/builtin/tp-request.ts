/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpConfigSchema } from '@tarpit/core'
import { Negotiator } from '@tarpit/negotiator'
import { IncomingHttpHeaders, IncomingMessage } from 'http'
import net from 'net'
import { ParsedUrlQuery } from 'querystring'
import tls from 'tls'
import type_is from 'type-is'
import { UrlWithParsedQuery } from 'url'
import { parse_cache_control, RequestCacheControl, ResponseCacheControl } from '../tools/cache-control'

export class TpRequest {

    type: string | undefined
    charset: string | undefined

    constructor(
        public readonly req: IncomingMessage,
        private readonly _url: UrlWithParsedQuery,
        private proxy: TpConfigSchema['http']['proxy'],
    ) {
    }

    private _cache_control?: ResponseCacheControl

    get cache_control(): RequestCacheControl | undefined {
        if (!this._cache_control) {
            this._cache_control = parse_cache_control(this.get('Cache-Control'))
        }
        return this._cache_control
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
        return this.search.replace(/^\?/, '')
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
        return this._url.protocol?.replace(/:\s*$/, '')
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
            const header = this.proxy?.ip_header ?? 'X-Forwarded-For'
            const max_ips_count = this.proxy?.max_ips_count ?? 0
            let val = this.get(header) ?? this.req.socket.remoteAddress
            if (val) {
                if (Array.isArray(val)) {
                    val = val[0]
                }
                this._ips = max_ips_count > 0
                    ? val.split(/\s*,\s*/).slice(-max_ips_count)
                    : val.split(/\s*,\s*/)
            } else {
                this._ips = []
            }
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

    get version_major() {
        return this.req.httpVersionMajor
    }

    get version() {
        return this.req.httpVersion
    }

    get socket(): (net.Socket & { encrypted: undefined }) | tls.TLSSocket {
        return this.req.socket as any
    }

    get length(): number | undefined {
        const len = this.get('Content-Length')
        return len ? +len : undefined
    }

    private _accepts?: Negotiator

    get accepts() {
        if (!this._accepts) {
            this._accepts = new Negotiator(this.req.headers)
        }
        return this._accepts
    }

    get if_match() {
        return this.get('If-Match')
    }

    get if_none_match() {
        return this.get('If-None-Match')
    }

    get if_modified_since() {
        const header = this.get('If-Modified-Since')
        return header ? Date.parse(header) : undefined
    }

    get if_unmodified_since() {
        const header = this.get('If-Unmodified-Since')
        return header ? Date.parse(header) : undefined
    }

    is(type: string, ...types: string[]) {
        return type_is(this.req, type, ...types)
    }

    is_idempotent() {
        const methods = ['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS', 'TRACE']
        return !!~methods.indexOf(this.req.method!)
    }

    get<P extends string>(field: P): (IncomingHttpHeaders & { referrer?: string | undefined })[Lowercase<P>] {
        const lower_field = field.toLowerCase() as Lowercase<P>
        switch (lower_field) {
            case 'referer':
            case 'referrer':
                return this.req.headers.referrer as any || this.req.headers.referer
            default:
                return this.req.headers[lower_field]
        }
    }
}
