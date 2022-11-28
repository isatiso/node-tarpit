/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { IncomingMessage } from 'http'
import { TLSSocket } from 'tls'
import { UrlWithParsedQuery } from 'url'
import { TpRequest } from './tp-request'

chai.use(cap)

describe('tp-request.ts', function() {

    describe('TpRequest', function() {

        const mock_incoming_message: IncomingMessage = {
            url: '/test/path?a=1&b=a',
            method: 'GET',
            socket: { encrypted: true, remoteAddress: '4.4.4.4' } as unknown as TLSSocket,
            headers: {
                'x-forwarded-for': '136.0.0.1,58.0.0.1,59.0.0.1,60.0.0.1',
                'x-custom-forwarded-for': '59.0.0.1,60.0.0.1',
                'x-array-header': ['59.0.0.1', '60.0.0.1'],
                'if-match': 'W/"12345"',
                'if-none-match': 'W/"67890"',
                'if-modified-since': 'Thu, 17 Nov 2022 08:36:24 GMT',
                'if-unmodified-since': 'Thu, 18 Nov 2022 08:36:24 GMT',
                'content-length': '872',
                'content-type': 'application/json; charset=utf-8',
                'cache-control': 'no-cache',
                'accept': 'text/plain',
                'referer': 'https://www.tarpit.cc/path?a=1&b=3'
            }
        } as any

        const mock_parsed_url: UrlWithParsedQuery = {
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
            query: { a: '1', b: 'a' },
        }

        describe('.href', function() {

            it('should return href of url object', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.href).to.equal(mock_parsed_url.href)
            })
        })

        describe('.path', function() {

            it('should return pathname of url object', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.path).to.equal(mock_parsed_url.pathname)
            })
        })

        describe('.query', function() {

            it('should return query of url object', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.query).to.eql(mock_parsed_url.query)
            })
        })

        describe('.query_string', function() {

            it('should return search of url object and remove beginning question mark', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.query_string).to.equal('a=1&b=a')
            })
        })

        describe('.search', function() {

            it('should return search of url object', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.search).to.equal(mock_parsed_url.search)
            })

            it('should return empty string if parsed_url.search is null', function() {
                const req = new TpRequest(mock_incoming_message, { ...mock_parsed_url, search: null }, { enable: true })
                expect(req.search).to.equal('')
            })
        })

        describe('.host', function() {

            it('should return host of url object', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.host).to.equal(mock_parsed_url.host)
            })
        })

        describe('.hostname', function() {

            it('should return hostname of url object', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.hostname).to.equal(mock_parsed_url.hostname)
            })
        })

        describe('.protocol', function() {

            it('should return protocol of url object and remove trailing colon', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.protocol).to.equal('https')
            })

            it('should return undefined if parsed_url.protocol is null', function() {
                const req = new TpRequest(mock_incoming_message, { ...mock_parsed_url, protocol: null }, { enable: true })
                expect(req.protocol).to.be.undefined
            })
        })

        describe('.secure', function() {

            it('should return true if protocol of url object is https, false on the other hand', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.secure).to.equal(true)
            })
        })

        describe('.origin', function() {

            it('should return assembled protocol and host of url object', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.origin).to.equal('https://www.tarpit.cc:1239')
            })
        })

        describe('.ips', function() {

            it('should read header "X-Forwarded-For" if ip_header is not specified', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.ips).to.eql(['136.0.0.1', '58.0.0.1', '59.0.0.1', '60.0.0.1'])
            })

            it('should limit count of ips if max_ip_count is specified', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true, max_ips_count: 2 })
                expect(req.ips).to.eql(['59.0.0.1', '60.0.0.1'])
            })

            it('should read specified ip_header', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true, ip_header: 'X-Custom-Forwarded-For' })
                expect(req.ips).to.eql(['59.0.0.1', '60.0.0.1'])
            })

            it('should use first element if header value is an array', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true, ip_header: 'X-Array-Header' })
                expect(req.ips).to.eql(['59.0.0.1'])
            })

            it('should use remote address of socket if header value is empty', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true, ip_header: 'X-Non-Exists-Header' })
                expect(req.ips).to.eql(['4.4.4.4'])
            })

            it('should use remote address of socket if header value is empty', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true, ip_header: 'X-Non-Exists-Header' })
                expect(req.ips).to.eql(['4.4.4.4'])
            })

            it('should return empty array if remote address of socket is also empty', function() {
                const req = new TpRequest({ ...mock_incoming_message, socket: { encrypted: true } } as any, mock_parsed_url, { enable: true, ip_header: 'X-Non-Exists-Header' })
                expect(req.ips).to.eql([])
            })

            it('should use parsed result', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true, ip_header: 'X-Array-Header' })
                expect(req.ips).to.equal(req.ips)
            })
        })

        describe('.ip', function() {

            it('should return first element of ips', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.ip).to.equal('136.0.0.1')
            })
        })

        describe('.headers', function() {

            it('should return header object of IncomingMessage', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.headers).to.eql(mock_incoming_message.headers)
            })
        })

        describe('.url', function() {

            it('should return url of IncomingMessage', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.url).to.equal(mock_incoming_message.url)
            })
        })

        describe('.method', function() {

            it('should return method of IncomingMessage', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.method).to.equal(mock_incoming_message.method)
            })
        })

        describe('.version_major', function() {

            it('should return version_major of IncomingMessage', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.version_major).to.equal(mock_incoming_message.httpVersionMajor)
            })
        })

        describe('.version', function() {

            it('should return version of IncomingMessage', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.version).to.equal(mock_incoming_message.httpVersion)
            })
        })

        describe('.socket', function() {

            it('should return socket of IncomingMessage', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.socket).to.equal(mock_incoming_message.socket)
            })
        })

        describe('.length', function() {

            it('should return length parsed from header Content-Length', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.length).to.equal(872)
            })

            it('should return undefined if header Content-Length not exists', function() {
                const req = new TpRequest({ ...mock_incoming_message, headers: {} } as any, mock_parsed_url, { enable: true })
                expect(req.length).to.be.undefined
            })
        })

        describe('.accepts', function() {

            it('should return accept object parsed from headers about Accept-*', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.accepts.preferred_media_types(['application/json', 'text/plain'])).to.eql(['text/plain'])
            })

            it('should use parsed result', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.accepts).to.equal(req.accepts)
            })
        })

        describe('.if_match', function() {

            it('should return header of If-Match', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.if_match).to.equal('W/"12345"')
            })
        })

        describe('.if_none_match', function() {

            it('should return header of If-None-Match', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.if_none_match).to.equal('W/"67890"')
            })
        })

        describe('.if_modified_since', function() {

            it('should return header of If-Modified-Since', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.if_modified_since).to.equal(1668674184000)
            })

            it('should return undefined if header of If-Modified-Since not exists', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                delete mock_incoming_message.headers['if-modified-since']
                expect(req.if_modified_since).to.be.undefined
            })
        })

        describe('.if_unmodified_since', function() {

            it('should return header of If-Unmodified-Since', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.if_unmodified_since).to.equal(1668760584000)
            })

            it('should return undefined if header of If-Unmodified-Since not exists', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                delete mock_incoming_message.headers['if-unmodified-since']
                expect(req.if_unmodified_since).to.be.undefined
            })
        })

        describe('.cache_control', function() {

            it('should return parsed value from header of Cache-Control', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.cache_control).to.eql({ 'no-cache': true })
            })

            it('should use saved value if called twice.', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                const value_a = req.cache_control
                expect(value_a).to.eql({ 'no-cache': true })
                expect(req.cache_control).to.equal(value_a)
            })

            it('should return undefined if header of Cache-Control not exists', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                delete mock_incoming_message.headers['cache-control']
                expect(req.cache_control).to.be.undefined
            })
        })

        describe('.is()', function() {

            it('should return true if content-type of IncomingMessage matched pattern, false on the other hand', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.is('application/json')).to.equal('application/json')
                expect(req.is('application/*')).to.equal('application/json')
                expect(req.is('text/plain')).to.be.false
            })
        })

        describe('.is_idempotent()', function() {

            it('should return true if request method is idempotent, false on the other hand', function() {
                expect(new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true }).is_idempotent()).to.be.true
                expect(new TpRequest({ ...mock_incoming_message, method: 'POST' } as any, mock_parsed_url, { enable: true }).is_idempotent()).to.be.false
            })
        })

        describe('.get()', function() {

            it('should return header under given key', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.get('X-Forwarded-For')).to.equal('136.0.0.1,58.0.0.1,59.0.0.1,60.0.0.1')
                expect(req.get('Content-Length')).to.equal('872')
            })

            it('should be case insensitive', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.get('Content-Length')).to.equal('872')
                expect(req.get('Content-length')).to.equal('872')
                expect(req.get('ConTEnt-length')).to.equal('872')
                expect(req.get('content-length')).to.equal('872')
            })

            it('should treat referer to referrer', function() {
                const req = new TpRequest(mock_incoming_message, mock_parsed_url, { enable: true })
                expect(req.get('Referer')).to.equal('https://www.tarpit.cc/path?a=1&b=3')
                expect(req.get('Referrer')).to.equal('https://www.tarpit.cc/path?a=1&b=3')
            })
        })
    })
})
