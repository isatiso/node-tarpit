/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { SymbolToken, TpService } from '@tarpit/core'
import LRUCache from 'lru-cache'

@SymbolToken('http')
@TpService({ inject_root: true })
export class HttpCacheProxy {

    private _cache = new LRUCache<string, string | object | Buffer>({ max: 5000 })

    async clear(scope: string, key: string): Promise<void> {
        this._cache.delete(`${scope}-${key}`)
    }

    async get(scope: string, key: string): Promise<string | object | Buffer | null> {
        return this._cache.get(`${scope}-${key}`) ?? null
    }

    async set(scope: string, key: string, value: string | object | Buffer, expire_secs: number): Promise<void> {
        this._cache.set(`${scope}-${key}`, value, { ttl: expire_secs * 1000 })
    }
}
