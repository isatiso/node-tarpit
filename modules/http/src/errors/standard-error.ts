/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { HTTP_STATUS } from '../tools/http-status'
import { TpHttpError, TpHttpErrorDescription } from './tp-http-error'

type Desc = Omit<TpHttpErrorDescription, 'code' | 'msg' | 'status'>

export class StandardError extends TpHttpError {
    constructor(
        status: number,
        msg: string,
        desc?: Desc
    ) {
        super({ ...desc, code: 'STANDARD_HTTP_ERROR', msg, status })
    }
}

export function throw_standard_error(status: number, msg?: string, desc?: Desc): never {
    const improved_msg = msg ?? HTTP_STATUS.message_of(status) ?? HTTP_STATUS.message_of(500)
    throw new StandardError(status, improved_msg, desc)
}

export function throw_bad_request(msg?: string, desc?: Desc): never {
    throw_standard_error(400, msg, desc)
}

export function throw_unauthorized(msg?: string, desc?: Desc): never {
    throw_standard_error(401, msg, desc)
}
