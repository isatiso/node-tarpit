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
import { HttpCacheProxy } from './http-cache-proxy'

chai.use(cap)
chai.use(chai_spies)

describe('http-cache-proxy.ts', function() {

    describe('HttpCacheProxy', function() {

        const cp = new HttpCacheProxy()

        describe('.set()', function() {

            it('should set cache', async function() {
                expect(cp.set('s', 'a', '1', 1200)).to.eventually.be.undefined
            })
        })

        describe('.get()', function() {

            it('should get cache', async function() {
                expect(cp.get('s', 'a')).to.eventually.equal('1')
                expect(cp.get('s', 'b')).to.eventually.be.null
            })
        })

        describe('.clear()', function() {

            it('should clear cache', async function() {
                expect(cp.clear('s', 'a')).to.eventually.be.undefined
            })
        })
    })
})
