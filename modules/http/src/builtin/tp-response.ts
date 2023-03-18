/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { OutgoingHttpHeader, OutgoingHttpHeaders, ServerResponse } from 'http'
import LRUCache from 'lru-cache'
import mime_types from 'mime-types'
import { Stream } from 'stream'
import { is as type_is } from 'type-is'
import { TpHttpResponseType } from '../__types__'
import { throw_internal_server_error, TpHttpFinish } from '../errors'
import { HTTP_STATUS } from '../tools/http-status'
import { on_error } from '../tools/on-error'
import { make_cache_control, parse_cache_control, ResponseCacheControl } from '../tools/cache-control'
import { TpRequest } from './tp-request'

const type_lru_cache = new LRUCache<string, string>({ max: 100 })

export function lookup_content_type(type: string): string {
    let mime_type = type_lru_cache.get(type)
    if (!mime_type) {
        mime_type = mime_types.contentType(type) || ''
        type_lru_cache.set(type, mime_type)
    }
    return mime_type
}

export class TpResponse {

    private _explicit_status = false
    private _cache_control?: ResponseCacheControl

    constructor(
        public readonly res: ServerResponse,
        public readonly request: TpRequest,
    ) {
    }

    private _body?: TpHttpResponseType = undefined
    get body() {
        return this._body
    }

    set body(val) {

        if (val === this._body) {
            return
        }

        this._body != null && this.remove('Content-Length')
        this._body = val

        if (val == null) {
            if (!HTTP_STATUS.is_empty(this.status)) {
                this.res.statusCode = 204
                this.res.statusMessage = HTTP_STATUS.message_of(204)
            }
            this.remove('Content-Type')
            this.remove('Content-Length')
            this.remove('Transfer-Encoding')
            return
        }

        if (!this._explicit_status) {
            this.res.statusCode = 200
            this.res.statusMessage = HTTP_STATUS.message_of(200)
        }

        if (val instanceof Stream) {
            val.once('error', err => on_error(err, this.res))
        }

        this.set_implicit_type()
    }

    get status() {
        return this.res.statusCode
    }

    set status(status_code: number) {
        if (this.res.headersSent) {
            return
        }

        if (!Number.isInteger(status_code) || status_code < 100 || status_code > 999) {
            throw_internal_server_error({
                code: 'ERR.INVALID_STATUS_CODE',
                msg: 'status code must be an integer within range of [100, 999]'
            })
        }

        this._explicit_status = true
        this.res.statusCode = status_code
        this.res.statusMessage = HTTP_STATUS.message_of(status_code) ?? ''

        if (HTTP_STATUS.is_empty(status_code)) {
            this.body = null
        }
    }

    get message(): string {
        return this.res.statusMessage
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
            return false
        }
        return this.res.socket.writable
    }

    get length(): number | undefined {
        const content_length = this.first('Content-Length')
        return content_length ? +content_length : undefined
    }

    set length(n: number | undefined) {
        if (n !== undefined) {
            n = Number.isInteger(n) ? n : Math.floor(n)
            this.set('Content-Length', n + '')
        } else {
            this.remove('Content-Length')
        }
    }

    get content_type(): string | undefined {
        const type = this.first('Content-Type')
        return type?.split(';', 1)[0].trim()
    }

    set content_type(type: string | undefined) {
        if (type !== undefined) {
            type = lookup_content_type(type)
            if (type) {
                this.set('Content-Type', type)
            }
        } else {
            this.remove('Content-Type')
        }
    }

    get cache_control(): ResponseCacheControl | undefined {
        if (!this._cache_control) {
            this._cache_control = parse_cache_control(this.first('Cache-Control'))
        }
        return this._cache_control
    }

    set cache_control(value: ResponseCacheControl | undefined) {
        if (value) {
            this.set('Cache-Control', make_cache_control(value))
        } else {
            this.set('Cache-Control', undefined)
        }
    }

    get last_modified(): number | undefined {
        const header = this.get('Last-Modified')
        if (Array.isArray(header) && header[0]) {
            return Date.parse(header[0])
        } else if (typeof header === 'string') {
            return Date.parse(header)
        } else {
            return
        }
    }

    get etag(): string | undefined {
        const header = this.get('ETag')
        return Array.isArray(header) ? header[0] : header
    }

    redirect(url: string, status: number = 302): never {
        this.status = HTTP_STATUS.is_redirect(status) ? status : 302
        this.set('Location', encodeURI(url))
        throw new TpHttpFinish({
            status: 302,
            code: this.status + '',
            msg: HTTP_STATUS.message_of(this.status)!,
            body: `Redirecting to ${url}`
        })
    }

    is(type: string, ...types: string[]) {
        return this.content_type && type_is(this.content_type, type, ...types) || undefined
    }

    has(field: string): boolean {
        return this.res.hasHeader(field)
    }

    get(field: string): string | string[] | undefined {
        return this.res.getHeader(field) as any
    }

    first(field: string) {
        const value = this.get(field)
        if (Array.isArray(value)) {
            return value[0]
        } else {
            return value
        }
    }

    set(field: string, val: undefined | null | number | string | string[]): void {
        if (this.res.headersSent) {
            return
        }
        if (Array.isArray(val)) {
            this.res.setHeader(field, val.map(v => v + ''))
        } else if (val === undefined) {
            this.res.removeHeader(field)
        } else {
            this.res.setHeader(field, val + '')
        }
        if (field.toLowerCase() === 'cache-control') {
            this._cache_control = undefined
        }
    }

    remove(field: string) {
        if (this.res.headersSent) {
            return
        }
        this.res.removeHeader(field)
    }

    clear() {
        this.res.getHeaderNames().forEach(header => this.remove(header))
    }

    merge(headers: Record<string, OutgoingHttpHeader>) {
        Object.entries(headers).forEach(([k, v]) => this.set(k, v))
    }

    append(field: string, val: number | string | string[]) {
        const prev = this.get(field)

        if (prev != null) {
            val = Array.isArray(prev)
                ? prev.concat(val + '')
                : [prev].concat(val + '')
        }

        return this.set(field, val)
    }

    flush_headers() {
        this.res.flushHeaders()
    }

    private set_implicit_type() {
        if (!this.has('Content-Type')) {
            if (typeof this._body === 'string') {
                this.content_type = 'text/plain; charset=utf-8'
            } else if (Buffer.isBuffer(this._body)) {
                this.content_type = 'application/octet-stream'
            } else if (this._body instanceof Stream) {
                this.content_type = 'application/octet-stream'
            } else {
                this.content_type = 'application/json; charset=utf-8'
            }
        }
    }
}
