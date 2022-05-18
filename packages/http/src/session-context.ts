/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { CacheProxy } from './__services__/cache-proxy'
import { LiteContext, TpHttpAuthInfo, TpHttpSession } from './__types__'
import { InnerFinish, OuterFinish } from './error'

/**
 * 请求上下文对象。
 *
 * @category Builtin
 */
export class SessionContext {

    private readonly cache_prefix: string
    private readonly cache_expires: number
    private cache_key?: string
    private _custom_data: Partial<TpHttpSession> = {}

    constructor(
        private _ctx: LiteContext,
        private _auth_info: TpHttpAuthInfo | undefined,
        private _cache: CacheProxy | undefined,
        cache_prefix?: string,
        cache_expires?: number,
    ) {
        this.cache_prefix = cache_prefix ?? this._ctx.path
        this.cache_expires = cache_expires ?? 3600
    }

    /**
     * 返回请求的 URL，包含 querystring 部分。
     */
    get url() {
        return this._ctx.req.url
    }

    /**
     * 返回请求的 HTTP 谓词，比如 GET，POST 等。
     */
    get method() {
        return this._ctx.req.method
    }

    /**
     * 返回请求路径，比如 `/test/return-value`
     */
    get path() {
        return this._ctx.path
    }

    /**
     * 返回请求的客户端 IP 地址，优先使用请求头 X-Real-Ip，如果找不到则使用 X-Forward-For 中的第一个 IP 地址。
     */
    get real_ip() {
        return this._ctx.request.get('X-Real-Ip') || this._ctx.request.get('X-Forwarded-For')?.split(',')[0] || this._ctx.ip
    }

    /**
     * 返回请求体的原始内容。
     */
    get rawBody() {
        return this._ctx.request.rawBody
    }

    /**
     * 以 `NodeJS.Dict` 形式返回解析后的 querystring。
     */
    get query(): NodeJS.Dict<string | string[]> {
        return this._ctx.query
    }

    /**
     * 返回用户信息，如果用户信息不存在，返回 undefined。
     * 通过声明全局 [[TpAuthInfo]] 接口定义授权数据类型。
     */
    get auth_info(): TpHttpAuthInfo | undefined {
        return this._auth_info
    }

    /**
     * 获取当前响应状态码。
     */
    get response_status() {
        return this._ctx.response.status
    }

    /**
     * 设置响应状态码。
     */
    set response_status(value: number) {
        this._ctx.response.status = value
    }

    /**
     * 设置用户自定义数据。
     * 通过声明全局 [[TpSession]] 接口定义自定义数据类型。
     *
     * @param key
     * @param value
     */
    set_data<M extends keyof TpHttpSession>(key: M, value: TpHttpSession[M]) {
        this._custom_data[key] = value
    }

    /**
     * 查询用户自定义数据。
     * 通过声明全局 [[TpSession]] 接口定义自定义数据类型。
     *
     * @param key
     */
    get_data<M extends keyof TpHttpSession>(key: M): TpHttpSession[M] | undefined {
        return this._custom_data[key]
    }

    /**
     * 获取指定的请求头。
     *
     * @param key 请求头名称，比如 `Content-Type`
     */
    header(key: string): string | string[] | undefined {
        return this._ctx.request.headers[key.toLowerCase()]
    }

    /**
     * 以 `NodeJS.Dict` 形式返回全部请求头。
     */
    headers(): NodeJS.Dict<string | string[]> {
        return this._ctx.request.headers
    }

    /**
     * 设置响应头。
     *
     * @param key 响应头字段，比如 `Content-Type`
     * @param value 需要设置的值
     */
    response_header(key: string, value: string | number) {
        this._ctx.response.set(key.toLowerCase(), value + '')
    }

    /**
     * 执行一次向 `url` 的 302 重定向。
     * 字符串 “back” 是特别提供 Referrer 支持的，当 Referrer 不存在时，使用 alt 或 `/`。
     *
     * e.g.
     * this.redirect('back');
     * this.redirect('back', '/index.html');
     * this.redirect('/login');
     * this.redirect('http://google.com');
     */
    redirect(url: string, alt?: string): never {
        this._ctx.redirect(url, alt)
        throw new OuterFinish('')
    }

    /**
     * 结束并返回请求处理结果。
     *
     * @param result 请求处理结果。
     */
    finish(result: any): never {
        throw new InnerFinish(result)
    }

    /**
     * 清除缓存，参考 [[CacheProxy.clear]]。
     *
     * @param key
     */
    async clear_cache(key: string) {
        return this._cache?.clear(key, this.cache_prefix, this.cache_expires)
    }

    /**
     * 查询缓存，如果缓存存在则直接返回结果。参考 [[CacheProxy.get]]。
     *
     * @param key
     */
    async get_cache<T = any>(key: string): Promise<T | undefined> {
        if (!this.cache_key) {
            this.cache_key = key
        }
        return key && await this._cache?.get(key, this.cache_prefix, this.cache_expires)
    }

    /**
     * 查询缓存，如果缓存存在则直接响应结果。参考 [[CacheProxy.get]]。
     *
     * @param key
     */
    async return_if_cache(key: string) {
        const cache = await this.get_cache(key)
        if (cache) {
            this.finish(cache)
        }
        return null
    }

    /**
     * 设置缓存并返回请求处理结果。参考 [[CacheProxy.set]]。
     *
     * @param may_be_promised
     */
    async finish_and_cache<T>(may_be_promised: Promise<T> | T): Promise<T>
    async finish_and_cache<T>(may_be_promised: Promise<T> | T, finish: true): Promise<never>
    async finish_and_cache<T>(may_be_promised: Promise<T> | T, finish?: true): Promise<T | never> {
        const info = await may_be_promised
        if (this.cache_key) {
            await this._cache?.set(this.cache_key, info, this.cache_prefix, this.cache_expires)
        }
        if (finish) {
            this.finish(info)
        }
        return Promise.resolve(info)
    }
}
