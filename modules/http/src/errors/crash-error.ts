/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpHttpError, TpHttpErrorDescription } from './tp-http-error'

type Desc = Omit<TpHttpErrorDescription, 'code' | 'msg'>

export class CrashError extends TpHttpError {
    constructor(
        code: number | string,
        msg: string,
        options?: Desc
    ) {
        super({ ...options, code, msg, status: 500 })
    }
}

export function throw_crash(code: string | number, msg: string, options?: Desc): never {
    throw new CrashError(code, msg, options)
}
