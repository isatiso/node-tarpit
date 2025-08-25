/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { describe, expect, it } from 'vitest'
import { HttpCacheProxy } from './http-cache-proxy'

describe('http-cache-proxy.ts', function() {

    describe('HttpCacheProxy', function() {

        const cp = new HttpCacheProxy()

        describe('.set()', function() {

            it('should set cache', async function() {
                await expect(cp.set('s', 'a', '1', 1200)).resolves.toBeUndefined()
            })
        })

        describe('.get()', function() {

            it('should get cache', async function() {
                await expect(cp.get('s', 'a')).resolves.toEqual('1')
                await expect(cp.get('s', 'b')).resolves.toBeNull()
            })
        })

        describe('.clear()', function() {

            it('should clear cache', async function() {
                await expect(cp.clear('s', 'a')).resolves.toBeUndefined()
            })
        })
    })
})
