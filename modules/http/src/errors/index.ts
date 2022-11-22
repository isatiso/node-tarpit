/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { create_tools, ThrowStandardError } from './tp-http-finish'

export { TpHttpFinish, TpHttpErrorDescription, TpHttpErrorHeader, throw_http_finish } from './tp-http-finish'

export { Finish, finish } from './finish'

export const throw_not_modified: ThrowStandardError = create_tools('throw_not_modified', 304)
export const throw_bad_request: ThrowStandardError = create_tools('throw_bad_request', 400)
export const throw_unauthorized: ThrowStandardError = create_tools('throw_unauthorized', 401)
export const throw_forbidden: ThrowStandardError = create_tools('throw_forbidden', 403)
export const throw_not_found: ThrowStandardError = create_tools('throw_not_found', 404)
export const throw_precondition_failed: ThrowStandardError = create_tools('throw_precondition_failed', 412)
export const throw_internal_server_error: ThrowStandardError = create_tools('throw_internal_server_error', 500)
