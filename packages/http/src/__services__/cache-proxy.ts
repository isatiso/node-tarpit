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
export abstract class CacheProxy {

    /**
     * 查询缓存。
     *
     * @param cache_key 通过 [[SessionContext.return_if_cache]] 传入的 key
     * @param cache_prefix 通过 [[Tp.CacheWith]] 设置
     * @param cache_expires 通过 [[Tp.CacheWith]] 设置
     */
    abstract get(cache_key: string, cache_prefix: string, cache_expires: number): Promise<any | null>

    /**
     * 设置缓存。
     *
     * @param cache_key 通过 [[SessionContext.return_if_cache]] 传入的 key
     * @param value 通过 [[SessionContext.finish_and_cache]] 传入的 info
     * @param cache_prefix 通过 [[Tp.CacheWith]] 设置
     * @param cache_expires 通过 [[Tp.CacheWith]] 设置
     */
    abstract set(cache_key: string, value: any, cache_prefix: string, cache_expires: number): Promise<void>

    /**
     * 清除缓存。
     *
     * @param cache_key 通过 [[SessionContext.return_if_cache]] 传入的 key
     * @param cache_prefix 通过 [[Tp.CacheWith]] 设置
     * @param cache_expires 通过 [[Tp.CacheWith]] 设置
     */
    abstract clear(cache_key: string, cache_prefix: string, cache_expires: number): Promise<number>
}
