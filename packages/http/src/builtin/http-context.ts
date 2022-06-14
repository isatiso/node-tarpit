/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import Cookies from 'cookies'
import { TpHttpSession } from '../__types__'
import { RouteUnit } from '../tools/collect-routes'
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
    private _custom_data: Partial<TpHttpSession> = {}

    constructor(
        private readonly _desc: RouteUnit,
        public readonly request: TpRequest,
        public readonly response: TpResponse,
    ) {
    }

    private _cookies?: Cookies

    get cookies() {
        if (!this._cookies) {
            this._cookies = new Cookies(this.request.req, this.response.res, {
                // TODO: options of Cookies
                // keys: this.app.keys,
                // secure: this.request.secure
            })
        }
        return this._cookies
    }

    set cookies(_cookies) {
        this._cookies = _cookies
    }

    /**
     * 设置用户自定义数据。
     * 通过声明全局 [[TpSession]] 接口定义自定义数据类型。
     *
     * @param key
     * @param value
     */
    set<M extends keyof TpHttpSession>(key: M, value: TpHttpSession[M]) {
        this._custom_data[key] = value
    }

    /**
     * 查询用户自定义数据。
     * 通过声明全局 [[TpSession]] 接口定义自定义数据类型。
     *
     * @param key
     */
    get<M extends keyof TpHttpSession>(key: M): TpHttpSession[M] | undefined {
        return this._custom_data[key]
    }
}