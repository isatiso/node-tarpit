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

/**
 * 请求上下文对象。
 *
 * @category Builtin
 */
export class HttpContext {

    public readonly req = this.request.req
    public readonly res = this.response.res
    private _custom_data: Partial<HttpSession> = {}

    constructor(
        public readonly request: TpRequest,
        public readonly response: TpResponse,
    ) {
    }

    /**
     * 设置用户自定义数据。
     * 通过声明全局 [[TpSession]] 接口定义自定义数据类型。
     *
     * @param key
     * @param value
     */
    set<M extends keyof HttpSession>(key: M, value: HttpSession[M]) {
        this._custom_data[key] = value
    }

    /**
     * 查询用户自定义数据。
     * 通过声明全局 [[TpSession]] 接口定义自定义数据类型。
     *
     * @param key
     */
    get<M extends keyof HttpSession>(key: M): HttpSession[M] | undefined {
        return this._custom_data[key]
    }
}
