/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { IncomingMessage, ServerResponse } from 'http'
import { CrashError, TpHttpError } from '../errors'
import { HTTP_STATUS } from './http-status'

export function on_error(err: any, req: IncomingMessage, res: ServerResponse) {

    if (null == err) {
        return
    }

    if (res.headersSent || !res.writable) {
        console.log(err.stack ?? err)
        return
    }

    let regular_err: TpHttpError
    if (!(err instanceof TpHttpError)) {
        regular_err = new CrashError('UNHANDLED_ERROR', HTTP_STATUS.message_of(500), { status: 500, origin: err, expose: true })
    } else {
        regular_err = err
    }

    res.getHeaderNames().forEach(name => res.removeHeader(name))
    const headers = regular_err.headers ?? {}
    Object.keys(headers).forEach(k => res.setHeader(k, headers[k]))

    res.statusCode = regular_err.status
    const msg = regular_err.expose ? regular_err.stack : HTTP_STATUS.message_of(regular_err.status) ?? HTTP_STATUS.message_of(500)
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Content-Length', Buffer.byteLength(msg))
    res.end(msg)
}
