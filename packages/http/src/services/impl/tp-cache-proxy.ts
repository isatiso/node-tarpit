/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '@tarpit/core'
import LRUCache from 'lru-cache'
import { AbstractCacheProxy } from '../inner/abstract-cache-proxy'

@TpService()
export class TpCacheProxy extends AbstractCacheProxy {

    private _cache = new LRUCache<string, string | object | Buffer>({ max: 5000 })

    async clear(scope: string, key: string): Promise<void> {
        this._cache.delete(`${scope}-${key}`)
        return
    }

    async get(scope: string, key: string): Promise<string | object | Buffer | null> {
        return this._cache.get(`${scope}-${key}`) ?? null
    }

    async set(scope: string, key: string, value: string | object | Buffer, expire_secs: number): Promise<void> {
        this._cache.set(`${scope}-${key}`, value, { ttl: expire_secs * 1000 })
        return
    }
}
