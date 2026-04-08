/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Readable, Stream } from 'stream'
import { ServerResponse } from 'http'
import { createBrotliCompress, createGzip } from 'zlib'
import { TpResponse } from '../builtin'
import { HTTP_STATUS } from './http-status'
import { on_error } from './on-error'

export interface CompressionOptions {
    enable?: boolean
    threshold?: number
}

function select_encoding(accept_encoding: string | string[] | undefined): 'br' | 'gzip' | null {
    if (!accept_encoding) {
        return null
    }
    const value = Array.isArray(accept_encoding) ? accept_encoding.join(',') : accept_encoding
    if (value.includes('br')) {
        return 'br'
    }
    if (value.includes('gzip')) {
        return 'gzip'
    }
    return null
}

function pipe_compressed(res: ServerResponse, encoding: 'br' | 'gzip', readable: Readable, on_err: (err: any) => void) {
    const compressor = encoding === 'br' ? createBrotliCompress() : createGzip()
    compressor.once('error', on_err)
    return readable.pipe(compressor).pipe(res)
}

function write_stream(response: TpResponse, encoding: 'br' | 'gzip' | null, stream: Readable, on_err: (err: any) => void) {
    if (encoding) {
        response.set('Content-Encoding', encoding)
        response.remove('Content-Length')
        return pipe_compressed(response.res, encoding, stream, on_err)
    }
    return stream.pipe(response.res)
}

function write_body(response: TpResponse, encoding: 'br' | 'gzip' | null, buf: Buffer, threshold: number, on_err: (err: any) => void, raw?: any) {
    if (encoding && buf.length >= threshold) {
        response.set('Content-Encoding', encoding)
        response.remove('Content-Length')
        return pipe_compressed(response.res, encoding, Readable.from(buf), on_err)
    }
    return response.res.end(raw ?? buf)
}

export function flush_response(response: TpResponse, compression?: CompressionOptions) {

    if (!response.writable) {
        return
    }

    if ((response as any)._status === undefined) {
        response.status = 200
    }

    if (!response.message) {
        response.message = HTTP_STATUS.message_of(response.status) ?? ''
    }

    if (response.body instanceof Stream) {
        response.body.once('error', err => on_error(err, response.res))
    }

    if (!(response.body instanceof Uint8Array) && ArrayBuffer.isView(response.body)) {
        response.body = new Uint8Array(response.body.buffer) as any
    }

    if (response.body == null) {
        if ((response as any)._status === undefined || !HTTP_STATUS.is_empty(response.status)) {
            response.status = 204
        }
        response.remove('Content-Type')
        response.remove('Content-Length')
        response.remove('Transfer-Encoding')
        return response.res.end()
    }

    if (!response.has('Content-Type')) {
        const body = response.body
        if (typeof body === 'string') {
            response.content_type = 'text/plain; charset=utf-8'
        } else if (Buffer.isBuffer(body) || body instanceof Stream) {
            response.content_type = 'application/octet-stream'
        } else {
            response.content_type = 'application/json; charset=utf-8'
        }
    }

    if (response.request.method === 'HEAD') {
        if (!response.has('Content-Length')) {
            if (response.body instanceof Stream) {
                // can not figure out length of content
            } else if (typeof response.body === 'string') {
                response.set('Content-Length', Buffer.byteLength(response.body))
            } else if (Buffer.isBuffer(response.body) || response.body instanceof Uint8Array) {
                response.set('Content-Length', response.body.length)
            } else {
                response.set('Content-Length', Buffer.byteLength(JSON.stringify(response.body)))
            }
        }
        return response.res.end()
    }

    if (HTTP_STATUS.is_empty(response.status)) {
        return response.res.end()
    }

    const encoding = compression?.enable && !response.has('Content-Encoding')
        ? select_encoding(response.request.get('Accept-Encoding'))
        : null

    const threshold = compression?.threshold ?? 1024

    const on_err = (err: any) => on_error(err, response.res)

    if (response.body instanceof Stream) {
        return write_stream(response, encoding, response.body as Readable, on_err)
    }

    if (Buffer.isBuffer(response.body)) {
        return write_body(response, encoding, response.body, threshold, on_err)
    }

    if (response.body instanceof Uint8Array) {
        const buf = Buffer.from(response.body.buffer, response.body.byteOffset, response.body.byteLength)
        return write_body(response, encoding, buf, threshold, on_err, response.body)
    }

    if (typeof response.body === 'string') {
        return write_body(response, encoding, Buffer.from(response.body), threshold, on_err, response.body)
    }

    const json_body = JSON.stringify(response.body)
    const buf = Buffer.from(json_body)
    response.length = buf.length
    return write_body(response, encoding, buf, threshold, on_err, json_body)
}
