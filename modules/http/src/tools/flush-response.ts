/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Stream } from 'stream'
import { TpResponse } from '../builtin'
import { HTTP_STATUS } from './http-status'
import { on_error } from './on-error'

export function flush_response(response: TpResponse) {

    if (!response.writable) {
        return
    }

    if (!response.status_implicit) {
        response.status = 200
    }

    if (!response.message) {
        response.message = HTTP_STATUS.message_of(response.status) ?? ''
    }

    // Compatible with the case where the body is ArrayBufferView
    if (ArrayBuffer.isView(response.body) && !(response.body instanceof Uint8Array)) {
        response.body = new Uint8Array(response.body.buffer) as any
    }

    if (response.body == null) {
        if (response.status_implicit || !HTTP_STATUS.is_empty(response.status)) {
            response.status = 204
        }
        response.remove('Content-Type')
        response.remove('Content-Length')
        response.remove('Transfer-Encoding')
        return response.res.end()
    }

    // set implicit content type
    if (!response.has('Content-Type')) {
        const body = response.body
        if (typeof body === 'string') {
            response.content_type = 'text/plain; charset=utf-8'
        } else if (Buffer.isBuffer(response.body)) {
            response.content_type = 'application/octet-stream'
        } else if (response.body instanceof Stream) {
            response.content_type = 'application/octet-stream'
        } else {
            response.content_type = 'application/json; charset=utf-8'
        }
    }

    // figure out content-length before write
    if (response.request.method === 'HEAD') {
        if (!response.has('Content-Length')) {
            if (!response.body) {
                response.set('Content-Length', 0)
            } else if (response.body instanceof Stream) {
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

    if (Buffer.isBuffer(response.body)) {
        return response.res.end(response.body)
    }

    if (response.body instanceof Uint8Array) {
        return response.res.end(response.body)
    }

    if ('string' === typeof response.body) {
        return response.res.end(response.body)
    }

    if (response.body instanceof Stream) {
        response.body.once('error', err => on_error(err, response.res))
        return response.body.pipe(response.res)
    }

    const json_body = JSON.stringify(response.body)
    response.length = Buffer.byteLength(json_body)
    return response.res.end(json_body)
}
