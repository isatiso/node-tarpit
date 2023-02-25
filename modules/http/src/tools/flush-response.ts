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

function figure_out_length(response: TpResponse): void {
    if (response.has('Content-Length')) {
        return
    }
    if (!response.body) {
        response.set('Content-Length', 0)
    } else if (response.body instanceof Stream) {
        // can not figure out length of content
    } else if (typeof response.body === 'string') {
        response.set('Content-Length', Buffer.byteLength(response.body))
    } else if (Buffer.isBuffer(response.body)) {
        response.set('Content-Length', response.body.length)
    } else {
        response.set('Content-Length', Buffer.byteLength(JSON.stringify(response.body)))
    }
}

export function flush_response(response: TpResponse) {

    if (!response.writable) {
        return
    }

    if (HTTP_STATUS.is_empty(response.status)) {
        return response.res.end()
    }

    figure_out_length(response)

    if (!response.message) {
        response.message = HTTP_STATUS.message_of(response.status) ?? ''
    }

    if (response.request.method === 'HEAD') {
        return response.res.end()
    }

    if (response.body == null) {
        response.remove('Content-Type')
        response.remove('Transfer-Encoding')
        return response.res.end()
    }

    if (Buffer.isBuffer(response.body)) {
        return response.res.end(response.body)
    }

    if ('string' === typeof response.body) {
        return response.res.end(response.body)
    }

    if (response.body instanceof Stream) {
        return response.body.pipe(response.res)
    }

    const json_body = JSON.stringify(response.body)
    response.length = Buffer.byteLength(json_body)
    return response.res.end(json_body)
}
