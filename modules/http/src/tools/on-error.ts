/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ServerResponse } from 'http'
import { throw_internal_server_error, TpHttpFinish } from '../errors'

export function on_error(err: any, res: ServerResponse) {

    if (!err) {
        return
    }

    if (res.headersSent) {
        if (res.writable) {
            res.end(err.stack ?? err.toString())
        }
        return
    }

    let regular_err: TpHttpFinish
    if (err instanceof TpHttpFinish) {
        regular_err = err
    } else {
        regular_err = throw_internal_server_error({
            code: 'UNHANDLED_ERROR',
            origin: err
        })
    }

    res.getHeaderNames().forEach(name => res.removeHeader(name))
    Object.entries(regular_err.headers).forEach(([k, v]) => res.setHeader(k, v))

    res.statusCode = regular_err.status
    const msg = JSON.stringify(regular_err.jsonify())
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.setHeader('content-length', Buffer.byteLength(msg))
    res.end(msg)
}
