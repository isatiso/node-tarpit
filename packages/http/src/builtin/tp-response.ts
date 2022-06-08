/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import assert from 'assert'
import contentDisposition from 'content-disposition'
import destroy from 'destroy'
import fresh from 'fresh'
import { OutgoingHttpHeaders, ServerResponse } from 'http'
import LRU from 'lru-cache'
import mime_types from 'mime-types'
import { extname } from 'path'
import { Stream } from 'stream'
import { is as typeis } from 'type-is'
import { HTTP_STATUS } from '../tools/http-status'
import { on_error } from '../tools/on-error'
import { on_finish } from '../tools/on-finished'
import { TpRequest } from './tp-request'

const type_lru_cache = new LRU({ max: 100 })

export function get_type(type: string): string {
    let mime_type = type_lru_cache.get<string>(type)
    if (!mime_type) {
        mime_type = mime_types.contentType(type) || ''
        type_lru_cache.set(type, mime_type)
    }
    return mime_type
}

export class TpResponse {

    public req = this.request.req
    private _explicit_status = false
    private _explicit_null_body = false

    constructor(
        public readonly res: ServerResponse,
        public readonly request: TpRequest,
    ) {
    }

    private _body: undefined | null | string | Buffer | Stream | object = null
    get body() {
        return this._body
    }

    set body(val) {
        const original = this._body
        this._body = val

        if (val == null) {
            if (!HTTP_STATUS.is_empty(this.status)) {
                this.status = 204
            }
            if (val === null) {
                this._explicit_null_body = true
            }
            this.remove('Content-Type')
            this.remove('Content-Length')
            this.remove('Transfer-Encoding')
            return
        }

        if (!this._explicit_status) {
            this.status = 200
        }

        const setType = !this.has('Content-Type')

        if (typeof val === 'string') {
            if (setType) {
                this.type = 'text'
            }
            this.length = Buffer.byteLength(val)
            return
        }

        if (Buffer.isBuffer(val)) {
            if (setType) {
                this.type = 'bin'
            }
            this.length = val.length
            return
        }

        if (val instanceof Stream) {
            on_finish(this.res, destroy.bind(null, val))
            if (original != val) {
                val.once('error', err => on_error(err, this.req, this.res))
                // overwriting
                if (original != null) {
                    this.remove('Content-Length')
                }
            }
            if (setType) {
                this.type = 'bin'
            }
            return
        }

        // json
        this.remove('Content-Length')
        this.type = 'json'
    }

    get socket() {
        return this.res.socket
    }

    get header(): OutgoingHttpHeaders {
        return this.res.getHeaders()
    }

    get headers(): OutgoingHttpHeaders {
        return this.header
    }

    get status() {
        return this.res.statusCode
    }

    set status(code: number) {
        if (this.res.headersSent) {
            return
        }

        assert(Number.isInteger(code), 'status code must be a number')
        assert(code >= 100 && code <= 999, `invalid status code: ${code}`)

        this._explicit_status = true
        this.res.statusCode = code
        if (this.req.httpVersionMajor < 2) {
            this.res.statusMessage = HTTP_STATUS.message_of(code) ?? ''
        }
        if (this.body && HTTP_STATUS.is_empty(code)) {
            this.body = null
        }
    }

    get message(): string {
        return this.res.statusMessage || HTTP_STATUS.message_of(this.status) || ''
    }

    set message(msg) {
        this.res.statusMessage = msg
    }

    get last_modified(): Date | string {
        const date = this.get('Last-Modified') as string
        if (date) {
            return new Date(date)
        }
        return ''
    }

    set last_modified(val: Date | string) {
        if (typeof val === 'string') {
            val = new Date(val)
        }
        this.set('Last-Modified', val.toUTCString())
    }

    get etag(): string | undefined {
        return this.get('ETag') as string
    }

    set etag(val: string | undefined) {
        if (!val) {
            this.set('ETag', '')
            return
        }
        if (!/^(W\/)?"/.test(val)) {
            val = `"${val}"`
        }
        this.set('ETag', val)
    }

    get type() {
        const type = this.get('Content-Type') as string
        if (!type) {
            return ''
        }
        return type.split(';', 1)[0]
    }

    set type(type) {
        type = get_type(type)
        if (type) {
            this.set('Content-Type', type)
        } else {
            this.remove('Content-Type')
        }
    }

    get writable() {
        if (this.res.writableEnded || this.res.finished) {
            return false
        }
        if (!this.res.socket) {
            return true
        }
        return this.res.socket.writable
    }

    get length(): number | undefined {
        if (this.has('Content-Length')) {
            return +(this.get('Content-Length') ?? 0)
        }
        if (!this.body || this.body instanceof Stream) {
            return undefined
        }
        if (typeof this.body === 'string') {
            return Buffer.byteLength(this.body)
        }
        if (Buffer.isBuffer(this.body)) {
            return this.body.length
        }
        return Buffer.byteLength(JSON.stringify(this.body))
    }

    set length(n: number | undefined) {
        if (n && !this.has('Transfer-Encoding')) {
            this.set('Content-Length', n + '')
        }
    }

    // vary(field: string) {
    //     if (this.res.headersSent) {
    //         return
    //     }
    //
    //     vary(this.res, field)
    // }

    get fresh() {
        const method = this.req.method
        const s = this.res.statusCode

        // GET or HEAD for weak freshness validation only
        if (method !== 'GET' && method !== 'HEAD') {
            return false
        }

        // 2xx or 304 as per rfc2616 14.26
        if ((s >= 200 && s < 300) || 304 === s) {
            return fresh(this.req.headers, this.res.getHeaders())
        }

        return false
    }

    get stale() {
        return !this.fresh
    }

    redirect(url: string, alt?: string) {

        if ('back' === url) {
            url = this.request.get('Referrer') as string || alt || '/'
        }
        this.set('Location', encodeURI(url))

        if (!HTTP_STATUS.is_redirect(this.status)) {
            this.status = 302
        }

        if (this.request.accepts('html')) {
            url = encodeURI(url)
            this.type = 'text/html; charset=utf-8'
            this.body = `Redirecting to <a href="${url}">${url}</a>.`
            return
        }

        // text
        this.type = 'text/plain; charset=utf-8'
        this.body = `Redirecting to ${url}.`
    }

    attachment(filename?: string, options?: contentDisposition.Options) {
        if (filename) {
            this.type = extname(filename)
        }
        this.set('Content-Disposition', contentDisposition(filename, options))
    }

    is(type: string, ...types: string[]) {
        return typeis(this.type, type, ...types)
    }

    has(field: string): boolean {
        return this.res.hasHeader(field)
    }

    get(field: string): string | string[] {
        return this.header[field.toLowerCase()] as string | string[] || ''
    }

    set(field: string, val: string | string[]): void {
        if (this.res.headersSent) {
            return
        }
        if (Array.isArray(val)) {
            val = val.map(v => v + '')
        } else {
            val = val + ''
        }
        this.res.setHeader(field, val)
    }

    remove(field: string) {
        if (this.res.headersSent) {
            return
        }
        this.res.removeHeader(field)
    }

    append(field: string, val: string | string[]) {
        const prev = this.get(field)

        if (prev) {
            val = Array.isArray(prev)
                ? prev.concat(val)
                : [prev].concat(val)
        }

        return this.set(field, val)
    }

    flush_headers() {
        this.res.flushHeaders()
    }

    respond() {

        if (!this.writable) {
            return
        }

        const res = this.res
        const code = this.status

        if (HTTP_STATUS.is_empty(code)) {
            this.body = null
            return res.end()
        }

        if (this.req.method === 'HEAD') {
            if (!res.headersSent && !this.has('Content-Length')) {
                if (Number.isInteger(this.length)) {
                    this.length = this.length
                }
            }
            return res.end()
        }

        if (this.body == null) {
            if (this._explicit_null_body) {
                this.remove('Content-Type')
                this.remove('Transfer-Encoding')
                return res.end()
            }
            if (this.req.httpVersionMajor >= 2) {
                this.body = String(code)
            } else {
                this.body = this.message || String(code)
            }
            if (!res.headersSent) {
                this.type = 'text'
                this.length = Buffer.byteLength(this.body)
            }
            return res.end(this.body)
        }

        if (Buffer.isBuffer(this.body)) {
            return res.end(this.body)
        }
        if ('string' === typeof this.body) {
            return res.end(this.body)
        }
        if (this.body instanceof Stream) {
            return this.body.pipe(res)
        }

        const json_body = JSON.stringify(this.body) ?? ''
        if (!res.headersSent) {
            this.length = Buffer.byteLength(json_body)
        }
        res.end(json_body)
    }
}
