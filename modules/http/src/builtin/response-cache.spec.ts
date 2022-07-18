/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import chai_spies from 'chai-spies'
import { ResponseCache } from '../builtin'
import { Finish } from '../errors'
import { HttpCacheProxy } from '../services/http-cache-proxy'

chai.use(cap)
chai.use(chai_spies)

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
            chai.spy.restore(temp_cache_proxy)
            const clear_spy = chai.spy.on(temp_cache_proxy, 'clear')
            const set_spy = chai.spy.on(temp_cache_proxy, 'set')
            const get_spy = chai.spy.on(temp_cache_proxy, 'get')
            return [clear_spy, set_spy, get_spy]
        }

        // const platform = new Platform({ http: { port: 3000 } })
        //     .import({ provide: TpCacheProxy, useValue: temp_cache_proxy })

        // const inspector = platform.expose(TpInspector)!

        it('should new instance', function() {
            const res = new ResponseCache(temp_cache_proxy, 'under', 1200)
            expect(res).to.be.instanceof(ResponseCache)
            expect(res).to.have.property('scope').which.equals('under')
            expect(res).to.have.property('expire_secs').which.equals(1200)
        })

        describe('#create()', function() {

            it('should create ResponseCache with parameters', function() {
                const res = ResponseCache.create(temp_cache_proxy, 'under', 1200)
                expect(res).to.be.instanceof(ResponseCache)
                expect(res).to.have.property('scope').which.equals('under')
                expect(res).to.have.property('expire_secs').which.equals(1200)
            })

            it('should create ResponseCache with default scope "@"', function() {
                const res = ResponseCache.create(temp_cache_proxy)
                expect(res).to.have.property('scope').which.equals('@')
            })

            it('should create ResponseCache with default expire_secs 3600', function() {
                const res = ResponseCache.create(temp_cache_proxy)
                expect(res).to.have.property('expire_secs').which.equals(3600)
            })
        })

        describe('.clear()', function() {

            it('should deliver the call to CacheProxy', async function() {
                const [clear_spy, set_spy, get_spy] = spy_cache_proxy()
                const res = ResponseCache.create(temp_cache_proxy)
                await res.clear('some_key')
                expect(set_spy).to.have.not.been.called()
                expect(get_spy).to.have.not.been.called()
                expect(clear_spy).to.have.been.first.called.with('@', 'some_key')
                chai.spy.restore(temp_cache_proxy)
            })
        })

        describe('.get()', function() {

            it('should deliver the call to CacheProxy', async function() {
                const [clear_spy, set_spy, get_spy] = spy_cache_proxy()
                const res = ResponseCache.create(temp_cache_proxy)
                await res.get('some_key')
                expect(set_spy).to.have.not.been.called()
                expect(clear_spy).to.have.not.been.called()
                expect(get_spy).to.have.been.first.called.with('@', 'some_key')
            })

            it('should return null if key is empty', async function() {
                const res = ResponseCache.create(temp_cache_proxy)
                expect(await res.get('')).to.be.null
            })

            it('should set cache_key by parameter of get', async function() {
                const res = ResponseCache.create(temp_cache_proxy)
                await res.get('abc')
                expect(res).to.have.property('cache_key').which.equals('abc')
            })
        })

        describe('.respond_if_cache()', function() {

            it('should do nothing but set cache_key if cache not exists', async function() {
                const [clear_spy, set_spy, get_spy] = spy_cache_proxy()
                const res = ResponseCache.create(temp_cache_proxy)
                await res.respond_if_cache('non_exists_key')
                expect(res).to.have.property('cache_key').which.equals('non_exists_key')
                expect(set_spy).to.have.not.been.called()
                expect(clear_spy).to.have.not.been.called()
                expect(get_spy).to.have.been.first.called.with('@', 'non_exists_key')
            })

            it('should throw Finish if cache exists', async function() {
                const [clear_spy, set_spy, get_spy] = spy_cache_proxy()
                const res = ResponseCache.create(temp_cache_proxy)
                let throwout: any
                try {
                    await res.respond_if_cache('exists_key')
                } catch (e) {
                    throwout = e
                }
                expect(throwout).to.be.instanceof(Finish)
                expect(set_spy).to.have.not.been.called()
                expect(clear_spy).to.have.not.been.called()
                expect(get_spy).to.have.been.first.called.with('@', 'exists_key')
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
                expect(throwout).to.be.instanceof(Finish)
                expect(throwout.response).to.equal('some value')
                expect(clear_spy).to.have.not.been.called()
                expect(set_spy).to.have.been.first.called.with('@', 'some_key', 'some value', 3600)
                expect(get_spy).to.have.been.first.called.with('@', 'some_key')
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
                expect(throwout).to.be.instanceof(Finish)
                expect(throwout.response).to.equal('some value')
                expect(clear_spy).to.have.not.been.called()
                expect(get_spy).to.have.not.been.called()
                expect(set_spy).to.have.not.been.called()
            })
        })
    })
})
