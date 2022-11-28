/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { expect } from 'chai'
import { make_cache_control, parse_cache_control } from './cache-control'

describe('cache-control.ts', function() {

    describe('#make_cache_control()', function() {

        it('should generate header value', function() {
            const str = make_cache_control({ public: true, 'no-cache': true, 'max-age': 86400 })
            expect(str).to.equal('public,no-cache,max-age=86400')
        })

        it('should return empty string if options is undefined', function() {
            const str = make_cache_control()
            expect(str).to.be.empty
        })

        it('should ignore field with value as undefined', function() {
            const str = make_cache_control({ public: true, 'no-cache': undefined, 'max-age': 86400 })
            expect(str).to.equal('public,max-age=86400')
        })
    })

    describe('#parse_cache_control()', function() {

        it('should parse header from string', function() {
            const cache_control = parse_cache_control('public,no-cache,max-age=86400')
            expect(cache_control).to.eql({ public: true, 'no-cache': true, 'max-age': 86400 })
        })

        it('should ignore max-age if there is not any number followed', function() {
            const cache_control = parse_cache_control('public,no-cache,max-age')
            expect(cache_control).to.eql({ public: true, 'no-cache': true })
        })

        it('should parse s-maxage', function() {
            const cache_control = parse_cache_control('public,no-cache,s-maxage=3600')
            expect(cache_control).to.eql({ public: true, 'no-cache': true, 's-maxage': 3600 })
        })

        it('should ignore s-maxage if there is not any number followed', function() {
            const cache_control = parse_cache_control('public,no-cache,s-maxage')
            expect(cache_control).to.eql({ public: true, 'no-cache': true })
        })

        it('should parse max-stale', function() {
            const cache_control = parse_cache_control('public,no-cache,max-stale=86400')
            expect(cache_control).to.eql({ public: true, 'no-cache': true, 'max-stale': 86400 })
        })

        it('should parse max-stale as MAX_NUMBER if no value followed', function() {
            const cache_control = parse_cache_control('public,no-cache,max-stale')
            expect(cache_control).to.eql({ public: true, 'no-cache': true, 'max-stale': Number.MAX_VALUE })
        })

        it('should parse min-fresh', function() {
            const cache_control = parse_cache_control('private,no-store,min-fresh=86400')
            expect(cache_control).to.eql({ private: true, 'no-store': true, 'min-fresh': 86400 })
        })

        it('should ignore min-fresh if there is not any number followed', function() {
            const cache_control = parse_cache_control('private,no-store,min-fresh')
            expect(cache_control).to.eql({ private: true, 'no-store': true })
        })
    })
})
