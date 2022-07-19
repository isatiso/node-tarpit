/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { HttpSession } from '../__types__'
import { TpRequest } from './tp-request'
import { TpResponse } from './tp-response'

export class HttpContext {

    public readonly req = this.request.req
    public readonly res = this.response.res
    private _custom_data: Partial<HttpSession> = {}

    constructor(
        public readonly request: TpRequest,
        public readonly response: TpResponse,
    ) {
    }

    set<M extends keyof HttpSession>(key: M, value: HttpSession[M]) {
        this._custom_data[key] = value
    }

    get<M extends keyof HttpSession>(key: M): HttpSession[M] | undefined {
        return this._custom_data[key]
    }
}
