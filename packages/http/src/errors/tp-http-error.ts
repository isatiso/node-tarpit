/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Stream } from 'stream'

export type TpHttpErrorHeader = { [key: string]: string }

export interface TpHttpErrorDescription {
    readonly code: string | number
    readonly msg: string
    readonly status: number
    readonly expose?: boolean
    readonly headers?: TpHttpErrorHeader
    readonly body?: undefined | string | object | Array<any> | Buffer | Stream
    readonly detail?: object
    readonly origin?: any
}

export class TpHttpError extends Error {

    public readonly code: string | number
    public readonly msg: string
    public readonly status: number
    public readonly expose?: boolean
    public readonly headers?: TpHttpErrorHeader
    public readonly body?: undefined | string | object | Array<any> | Buffer | Stream
    public readonly detail?: object
    public readonly origin?: any
    public readonly stack: string

    constructor(
        desc: TpHttpErrorDescription,
    ) {
        super(desc.msg)
        this.code = desc.code ?? 'ERR'
        this.msg = desc.msg ?? 'Internal Server Error'
        this.status = desc.status ?? 500
        this.expose = desc.expose ?? false
        this.headers = desc.headers ?? {}
        this.body = desc.body ?? ''
        this.detail = desc.detail
        this.origin = desc.origin
        if (desc.origin?.stack) {
            this.stack = desc.origin.stack
        } else if (desc.origin) {
            this.stack = desc.origin.toString()
        } else {
            this.stack = ''
        }
    }

    jsonify(fields?: (keyof TpHttpError)[]) {
        fields = fields ?? ['code', 'msg', 'status', 'headers', 'body', 'detail', 'stack'] as (keyof TpHttpError)[]
        const res: any = {}
        for (const f of fields) {
            res[f] = this[f]
        }
        return res
    }
}
