/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import content_disposition from 'content-disposition'
import destroy from 'destroy'
import fresh from 'fresh'
import { OutgoingHttpHeaders, ServerResponse } from 'http'
import LRU from 'lru-cache'
import mime_types from 'mime-types'
import { extname } from 'path'
import { Stream } from 'stream'
import { is as type_is } from 'type-is'
import { throw_crash } from '../errors'
import { HTTP_STATUS } from '../tools/http-status'
import { on_error } from '../tools/on-error'
import { on_finish } from '../tools/on-finished'
import { TpRequest } from './tp-request'

const type_lru_cache = new LRU({ max: 100 })

function lookup_content_type(type: string): string {
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

        const set_type = !this.has('Content-Type')

        if (typeof val === 'string') {
            if (set_type) {
                this.set_content_type('text')
            }
            this.length = Buffer.byteLength(val)
            return
        }

        if (Buffer.isBuffer(val)) {
            if (set_type) {
                this.set_content_type('bin')
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
            if (set_type) {
                this.set_content_type('bin')
            }
            return
        }

        // json
        this.remove('Content-Length')
        this.set_content_type('json')
    }

    get status() {
        return this.res.statusCode
    }

    set status(status_code: number) {
        if (this.res.headersSent) {
            return
        }

        if (Number.isInteger(status_code) && status_code >= 100 && status_code <= 999) {
            this._explicit_status = true
            this.res.statusCode = status_code
        } else {
            throw_crash('ERR.INVALID_STATUS_CODE', 'status code must be an integer and within range of [100, 999]')
        }

        if (this.req.httpVersionMajor < 2) {
            this.res.statusMessage = HTTP_STATUS.message_of(status_code) ?? ''
        }

        if (this.body && HTTP_STATUS.is_empty(status_code)) {
            this.body = null
        }
    }

    get message(): string {
        return this.res.statusMessage || HTTP_STATUS.message_of(this.status) || ''
    }

    set message(msg) {
        this.res.statusMessage = msg
    }

    get socket() {
        return this.res.socket
    }

    get headers(): OutgoingHttpHeaders {
        return this.res.getHeaders()
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
            return
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

    get content_type() {
        const type = this.get('Content-Type') as string
        return type?.split(';', 1)[0]
    }

    get etag(): string | undefined {
        return this.get('ETag') as string
    }

    get last_modified(): Date | undefined {
        const date = this.get('Last-Modified') as string
        return date ? new Date(date) : undefined
    }

    set_content_type(type: string) {
        type = lookup_content_type(type)
        if (type) {
            this.set('Content-Type', type)
        } else {
            this.remove('Content-Type')
        }
    }

    set_etag(val: string | undefined) {
        if (!val) {
            this.set('ETag', '')
            return
        }
        if (!/^(W\/)?"/.test(val)) {
            val = `"${val}"`
        }
        this.set('ETag', val)
    }

    set_last_modified(val: Date) {
        this.set('Last-Modified', val.toUTCString())
    }

    set_attachment(filename?: string, options?: content_disposition.Options) {
        if (filename) {
            this.set_content_type(extname(filename))
        }
        this.set('Content-Disposition', content_disposition(filename, options))
    }

    redirect(url: string, alt?: string) {

        if ('back' === url) {
            url = this.request.get('Referrer') as string || alt || '/'
        }
        this.set('Location', encodeURI(url))

        if (!HTTP_STATUS.is_redirect(this.status)) {
            this.status = 302
        }

        if (this.request.accepts.types('html')) {
            url = encodeURI(url)
            this.set_content_type('html')
            this.body = `Redirecting to <a href="${url}">${url}</a>.`
            return
        }

        // text
        this.set_content_type('txt')
        this.body = `Redirecting to ${url}.`
    }

    is(type: string, ...types: string[]) {
        return type_is(this.content_type, type, ...types)
    }

    has(field: string): boolean {
        return this.res.hasHeader(field)
    }

    get(field: string): string | string[] {
        return this.headers[field.toLowerCase()] as string | string[] || ''
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
                this.set_content_type('txt')
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
