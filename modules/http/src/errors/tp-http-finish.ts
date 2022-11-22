/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpError, TpErrorDescription } from '@tarpit/error'
import { TpHttpResponseType } from '../__types__'
import { HTTP_STATUS } from '../tools/http-status'

export type TpHttpErrorHeader = { [key: string]: string }

export interface TpHttpErrorDescription extends TpErrorDescription {
    readonly status: number
    readonly headers?: TpHttpErrorHeader
    readonly body?: TpHttpResponseType
}

export type ThrowStandardError = (desc?: (string | Partial<Omit<TpHttpErrorDescription, 'status'>>)) => never

export class TpHttpFinish<E = any> extends TpError<E> {

    public readonly status: number
    public readonly headers: TpHttpErrorHeader
    public readonly body?: TpHttpResponseType

    override jsonify_fields: Array<keyof this> = ['code', 'msg', 'status', 'headers', 'body', 'detail', 'stack']

    constructor(
        desc: TpHttpErrorDescription,
    ) {
        super(desc)
        if (Number.isInteger(desc.status) && 100 <= desc.status && desc.status <= 999) {
            this.status = desc.status
        } else {
            this.status = 500
        }
        this.headers = desc.headers ?? {}
        this.body = desc.body
    }

    static isTpHttpFinish(value: any): value is TpHttpFinish {
        return value instanceof TpHttpFinish
    }
}

export function throw_http_finish(status: number, options?: Partial<Omit<TpHttpErrorDescription, 'status'>>): never {
    const code = options?.code ?? status + ''
    const msg = options?.msg ?? HTTP_STATUS.message_of(status) ?? HTTP_STATUS.message_of(500)
    throw new TpHttpFinish({ ...options, status, code, msg })
}

export function create_tools(name: string, status: number): ThrowStandardError {
    return {
        [name]: function(desc?: string | Partial<Omit<TpHttpErrorDescription, 'status'>>): never {
            if (typeof desc === 'string') {
                throw_http_finish(status, { msg: desc })
            } else {
                throw_http_finish(status, desc)
            }
        }
    }[name]
}


