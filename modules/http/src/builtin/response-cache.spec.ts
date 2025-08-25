/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { ResponseCache } from '../builtin'
import { Finish } from '../errors'
import { HttpCacheProxy } from '../services/http-cache-proxy'

describe('response-cache.ts', function() {

    describe('ResponseCache', function() {

        const temp_cache_proxy = {
            async clear(_scope: string, _key: string): Promise<void> {
            },
            async get(scope: string, key: string): Promise<string | object | Buffer | null> {
                if (key === 'exists_key') {
                    return 'exists_value'
                }
                return null
            },
            async set(_scope: string, _key: string, _value: string | object | Buffer, _expire_secs: number): Promise<void> {
            },
        } as HttpCacheProxy

        function spy_cache_proxy() {
            const clear_spy = vi.spyOn(temp_cache_proxy, 'clear')
            const set_spy = vi.spyOn(temp_cache_proxy, 'set')
            const get_spy = vi.spyOn(temp_cache_proxy, 'get')
            return [clear_spy, set_spy, get_spy]
        }

        afterEach(() => {
            vi.restoreAllMocks()
        })

        it('should new instance', function() {
            const res = new ResponseCache(temp_cache_proxy, 'under', 1200)
            expect(res).toBeInstanceOf(ResponseCache)
            expect(res.scope).toEqual('under')
            expect(res.expire_secs).toEqual(1200)
        })

        describe('#create()', function() {

            it('should create ResponseCache with parameters', function() {
                const res = ResponseCache.create(temp_cache_proxy, 'under', 1200)
                expect(res).toBeInstanceOf(ResponseCache)
                expect(res.scope).toEqual('under')
                expect(res.expire_secs).toEqual(1200)
            })

            it('should create ResponseCache with default scope "@"', function() {
                const res = ResponseCache.create(temp_cache_proxy)
                expect(res.scope).toEqual('@')
            })

            it('should create ResponseCache with default expire_secs 3600', function() {
                const res = ResponseCache.create(temp_cache_proxy)
                expect(res.expire_secs).toEqual(3600)
            })
        })

        describe('.clear()', function() {

            it('should deliver the call to CacheProxy', async function() {
                const [clear_spy, set_spy, get_spy] = spy_cache_proxy()
                const res = ResponseCache.create(temp_cache_proxy)
                await res.clear('some_key')
                expect(set_spy).not.toHaveBeenCalled()
                expect(get_spy).not.toHaveBeenCalled()
                expect(clear_spy).toHaveBeenCalledWith('@', 'some_key')
            })
        })

        describe('.get()', function() {

            it('should deliver the call to CacheProxy', async function() {
                const [clear_spy, set_spy, get_spy] = spy_cache_proxy()
                const res = ResponseCache.create(temp_cache_proxy)
                await res.get('some_key')
                expect(set_spy).not.toHaveBeenCalled()
                expect(clear_spy).not.toHaveBeenCalled()
                expect(get_spy).toHaveBeenCalledWith('@', 'some_key')
            })

            it('should return null if key is empty', async function() {
                const res = ResponseCache.create(temp_cache_proxy)
                expect(await res.get('')).toBeNull()
            })
        })

        describe('.respond_if_cache()', function() {

            it('should set internal cache_key for later use if cache not exists', async function() {
                const [clear_spy, set_spy, get_spy] = spy_cache_proxy()
                const res = ResponseCache.create(temp_cache_proxy)
                await res.respond_if_cache('non_exists_key')
                expect(set_spy).not.toHaveBeenCalled()
                expect(clear_spy).not.toHaveBeenCalled()
                expect(get_spy).toHaveBeenCalledWith('@', 'non_exists_key')
                try {
                    await res.cache_and_respond('some value')
                } catch (e) {
                    expect(e).toBeInstanceOf(Finish)
                }
                expect(set_spy).toHaveBeenCalledWith('@', 'non_exists_key', 'some value', 3600)
            })

            it('should throw Finish if cache exists', async function() {
                const [clear_spy, set_spy, get_spy] = spy_cache_proxy()
                const res = ResponseCache.create(temp_cache_proxy)
                await expect(res.respond_if_cache('exists_key')).rejects.toThrow(Finish)
                expect(set_spy).not.toHaveBeenCalled()
                expect(clear_spy).not.toHaveBeenCalled()
                expect(get_spy).toHaveBeenCalledWith('@', 'exists_key')
            })
        })

        describe('.cache_and_respond()', function() {

            it('should set cache by given value', async function() {
                const [clear_spy, set_spy, get_spy] = spy_cache_proxy()
                const res = ResponseCache.create(temp_cache_proxy)
                await res.get('some_key')
                let throwout: any
                try {
                    await res.cache_and_respond('some value')
                } catch (e) {
                    throwout = e
                }
                expect(throwout).toBeInstanceOf(Finish)
                expect(throwout.response).toEqual('some value')
                expect(clear_spy).not.toHaveBeenCalled()
                expect(set_spy).toHaveBeenCalledWith('@', 'some_key', 'some value', 3600)
                expect(get_spy).toHaveBeenCalledWith('@', 'some_key')
            })

            it('should only throw Finish if no cache_key set', async function() {
                const [clear_spy, set_spy, get_spy] = spy_cache_proxy()
                const res = ResponseCache.create(temp_cache_proxy)
                let throwout: any
                try {
                    await res.cache_and_respond('some value')
                } catch (e) {
                    throwout = e
                }
                expect(throwout).toBeInstanceOf(Finish)
                expect(throwout.response).toEqual('some value')
                expect(clear_spy).not.toHaveBeenCalled()
                expect(get_spy).not.toHaveBeenCalled()
                expect(set_spy).not.toHaveBeenCalled()
            })
        })
    })
})
