/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema } from '@tarpit/core'
import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { get_first, HttpUrlParser } from './http-url-parser'

chai.use(cap)

describe('http-url-parser.ts', function() {

    describe('#get_first()', function() {

        it('should extract first element of given value is an array', function() {
            expect(get_first(['a', 'b'])).to.equal('a')
        })

        it('should return value self if it is not an array', function() {
            expect(get_first('2')).to.equal('2')
        })
    })

    describe('HttpUrlParser', function() {

        describe('.parse()', function() {

            const proxy_platform = new Platform(load_config<TpConfigSchema>({ http: { port: 3000, proxy: { enable: true } } })).import(HttpUrlParser)
            const proxy_parser = proxy_platform.expose(HttpUrlParser)!

            const no_proxy_platform = new Platform(load_config<TpConfigSchema>({ http: { port: 3000, proxy: { enable: false } } })).import(HttpUrlParser)
            const no_proxy_parser = no_proxy_platform.expose(HttpUrlParser)!

            it('should parse full url', function() {
                const url = proxy_parser.parse({
                    url: 'https://www.tarpit.cc:1239/test/path?a=1&b=a',
                    headers: {},
                })
                expect(url).to.include({
                    protocol: 'https:',
                    auth: null,
                    hash: null,
                    host: 'www.tarpit.cc:1239',
                    hostname: 'www.tarpit.cc',
                    href: 'https://www.tarpit.cc:1239/test/path?a=1&b=a',
                    path: '/test/path?a=1&b=a',
                    pathname: '/test/path',
                    port: '1239',
                    search: '?a=1&b=a',
                    slashes: true,
                })
                expect(url?.query).to.eql({ a: '1', b: 'a' })
            })

            it('should treat url as "/" if url is undefined', function() {
                const url = proxy_parser.parse({ url: undefined, headers: { host: 'www.tarpit.cc' } })
                expect(url).to.include({ protocol: 'http:', host: 'www.tarpit.cc', href: 'http://www.tarpit.cc/' })
            })

            it('should treat host as "localhost" if figure host failed', function() {
                const url = proxy_parser.parse({ url: '/path', headers: {} })
                expect(url).to.include({ protocol: 'http:', host: 'localhost', href: 'http://localhost/path' })
            })

            it('should path auth fields of url', function() {
                const url = proxy_parser.parse({
                    url: 'https://user:password@www.tarpit.cc:1239/test/path?a=1&b=a',
                    headers: {},
                })
                expect(url).to.include({
                    auth: 'user:password',
                })
            })

            it('should always return http if url does not contain proto and socket is not encrypted and proxy disabled', function() {
                const url1 = no_proxy_parser.parse({ url: '/test/path?a=1&b=a', headers: { 'x-forwarded-proto': 'https', host: 'www.tarpit.cc' } })
                expect(url1).to.include({ protocol: 'http:', host: 'www.tarpit.cc', href: 'http://www.tarpit.cc/test/path?a=1&b=a' })
                const url2 = no_proxy_parser.parse({ url: '/test/path?a=1&b=a', headers: { 'x-forwarded-proto': 'http', host: 'www.tarpit.cc' } })
                expect(url2).to.include({ protocol: 'http:', host: 'www.tarpit.cc', href: 'http://www.tarpit.cc/test/path?a=1&b=a' })
            })

            it('should use host from header "x-forwarded-host" if url does not contain host and proxy enabled', function() {
                const url = proxy_parser.parse({
                    url: '/test/path?a=1&b=a',
                    headers: { 'x-forwarded-host': 'forwarded.tarpit.cc', host: 'www.tarpit.cc' },
                })
                expect(url).to.include({ protocol: 'http:', host: 'forwarded.tarpit.cc', href: 'http://forwarded.tarpit.cc/test/path?a=1&b=a' })
            })

            it('should return undefined if parse url failed', function() {
                const url = no_proxy_parser.parse({
                    url: 'https://asd%qwe:asd@www.tarpit.cc',
                    headers: { 'x-forwarded-host': 'forwarded.tarpit.cc', host: 'www.tarpit.cc' },
                })
                expect(url).to.be.undefined
            })
        })
    })
})
