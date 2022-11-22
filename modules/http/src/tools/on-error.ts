/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ServerResponse } from 'http'
import { TpHttpFinish } from '../errors'
import { HTTP_STATUS } from './http-status'

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
        regular_err = new TpHttpFinish({ status: 500, code: 'ERR.UNCAUGHT_ERROR', msg: HTTP_STATUS.message_of(500), origin: err })
    }

    res.getHeaderNames().forEach(name => res.removeHeader(name))
    Object.entries(regular_err.headers).forEach(([k, v]) => res.setHeader(k, v))

    res.statusCode = regular_err.status
    const msg = JSON.stringify(regular_err.jsonify())
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.setHeader('content-length', Buffer.byteLength(msg))
    res.end(msg)
}
