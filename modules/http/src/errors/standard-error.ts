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

export function throw_standard_status(status: number, desc?: Desc & { msg?: string }): never {
    const improved_msg = desc?.msg ?? HTTP_STATUS.message_of(status) ?? HTTP_STATUS.message_of(500)
    throw new StandardError(status, improved_msg, desc)
}

export type ThrowStandardError = (desc?: (string | (Desc & { msg?: string }))) => never

function create_tools(name: string, status: number): ThrowStandardError {
    return {
        [name]: function(desc?: string | (Desc & { msg?: string })): never {
            if (typeof desc === 'string') {
                throw_standard_status(status, { msg: desc })
            } else {
                throw_standard_status(status, desc)
            }
        }
    }[name]
}

export const throw_bad_request: ThrowStandardError = create_tools('throw_bad_request', 400)
export const throw_unauthorized: ThrowStandardError = create_tools('throw_unauthorized', 401)
export const throw_forbidden: ThrowStandardError = create_tools('throw_forbidden', 403)
