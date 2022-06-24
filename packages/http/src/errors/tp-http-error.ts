/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpError, TpErrorDescription } from '@tarpit/error'
import { Stream } from 'stream'

export type TpHttpErrorHeader = { [key: string]: string }

export interface TpHttpErrorDescription extends TpErrorDescription {
    readonly status: number
    readonly expose?: boolean
    readonly headers?: TpHttpErrorHeader
    readonly body?: undefined | string | object | Array<any> | Buffer | Stream
}

export class TpHttpError extends TpError {

    public readonly status: number
    public readonly expose?: boolean
    public readonly headers?: TpHttpErrorHeader
    public readonly body?: undefined | string | object | Array<any> | Buffer | Stream

    override jsonify_fields: Array<keyof this> = ['code', 'msg', 'status', 'headers', 'body', 'detail', 'stack']

    constructor(
        desc: TpHttpErrorDescription,
    ) {
        super(desc)
        this.status = desc.status ?? 500
        this.expose = desc.expose ?? false
        this.headers = desc.headers ?? {}
        this.body = desc.body ?? ''
    }
}
