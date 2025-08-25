/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { finish } from '../errors'
import { HttpCacheProxy } from '../services/http-cache-proxy'

export class ResponseCache {

    private cache_key?: string

    constructor(
        private cache_proxy: HttpCacheProxy,
        public readonly scope: string,
        public readonly expire_secs: number,
    ) {
    }

    static create(cache_proxy: HttpCacheProxy, scope?: string, expire_secs?: number) {
        return new ResponseCache(cache_proxy, scope ?? '@', expire_secs ?? 3600)
    }

    async clear(key: string): Promise<void> {
        return this.cache_proxy.clear(this.scope, key)
    }

    async get(key: string): Promise<string | Buffer | object | null> {
        if (!key) {
            return null
        }
        this.cache_key = key
        return this.cache_proxy.get(this.scope, key)
    }

    async respond_if_cache(key: string): Promise<void> {
        const cache = await this.get(key)
        if (cache) {
            finish(cache)
        }
    }

    async cache_and_respond<T extends string | object | Buffer>(may_be_promised: Promise<T> | T): Promise<never> {
        const info = await may_be_promised
        if (this.cache_key) {
            await this.cache_proxy.set(this.scope, this.cache_key, info, this.expire_secs)
        }
        finish(info)
    }
}
