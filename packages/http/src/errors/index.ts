/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

export { TpHttpError, TpHttpErrorDescription, TpHttpErrorHeader } from './tp-http-error'
export { BusinessError, throw_business } from './business-error'
export { CrashError, throw_crash } from './crash-error'
export { Finish, finish } from './finish'
export { StandardError, throw_standard_error, throw_unauthorized, throw_bad_request } from './standard-error'

export function throw_native_error(msg: string): never {
    throw new Error(msg)
}
