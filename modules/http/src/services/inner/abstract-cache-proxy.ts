/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

/**
 * 缓存代理服务接口，通过实现抽象类，实现一个请求结果的缓存服务。
 *
 * [[include:core/service/cache-proxy.md]]
 *
 * @category Abstract Service
 */

export abstract class AbstractCacheProxy {

    /**
     * 清除缓存。
     *
     * @param scope 通过 [[Tp.CacheWith]] 设置
     * @param key 通过 [[HttpContext.return_if_cache]] 传入的 key
     */
    abstract clear(scope: string, key: string): Promise<void>

    /**
     * 查询缓存。
     *
     * @param scope 通过 [[Tp.CacheWith]] 设置
     * @param key 通过 [[HttpContext.return_if_cache]] 传入的 key
     */
    abstract get(scope: string, key: string): Promise<string | object | Buffer | null>

    /**
     * 设置缓存。
     *
     * @param scope 通过 [[Tp.CacheWith]] 设置
     * @param key 通过 [[HttpContext.return_if_cache]] 传入的 key
     * @param value 通过 [[HttpContext.cache_and_respond]] 传入的 info
     * @param expire_secs 通过 [[Tp.CacheWith]] 设置
     */
    abstract set(scope: string, key: string, value: string | object | Buffer, expire_secs: number): Promise<void>
}
