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

export function flush_response(response: TpResponse) {
    if (!response.writable) {
        return
    }

    if (HTTP_STATUS.is_empty(response.status)) {
        response.body = null
        return response.res.end()
    }

    if (response.request.method === 'HEAD') {
        if (!response.has('Content-Length')) {
            response.figure_out_length()
        }
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
    response.res.end(json_body)
}
