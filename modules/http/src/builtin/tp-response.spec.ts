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
import { ServerResponse } from 'http'
import { Readable } from 'stream'
import { TpHttpFinish } from '../errors'
import { HTTP_STATUS } from '../tools/http-status'
import { lookup_content_type, TpResponse } from './tp-response'

chai.use(cap)
chai.use(chai_spies)

describe('tp-response.ts', function() {

    describe('#lookup_content_type()', function() {

        it('should cache result of parsing mime types', function() {
            expect(lookup_content_type('json')).to.equal('application/json; charset=utf-8')
        })

        it('should use cache if results exists', function() {
            expect(lookup_content_type('json')).to.equal('application/json; charset=utf-8')
        })
    })

    describe('TpResponse', function() {

        const origin_mocked_server_response = {
            headersSent: false,
            statusCode: 400,
            writable: true,
            writableEnded: false,
            writableFinished: false,
            statusMessage: 'Not Found',
        }

        function mock_server_response() {
            const mock_res = { ...origin_mocked_server_response, socket: { encrypted: undefined, writable: true } } as unknown as ServerResponse
            const mock_headers: any = {}
            const spy_flushHeaders = chai.spy.on(mock_res, 'flushHeaders', () => undefined)
            const spy_getHeader = chai.spy.on(mock_res, 'getHeader', (key: string) => mock_headers[key.toLowerCase()])
            const spy_getHeaderNames = chai.spy.on(mock_res, 'getHeaderNames', () => Object.keys(mock_headers))
            const spy_getHeaders = chai.spy.on(mock_res, 'getHeaders', () => mock_headers)
            const spy_hasHeader = chai.spy.on(mock_res, 'hasHeader', (key: string) => mock_headers[key.toLowerCase()] !== undefined)
            const spy_removeHeader = chai.spy.on(mock_res, 'removeHeader', (key: string) => delete mock_headers[key.toLowerCase()])
            const spy_setHeader = chai.spy.on(mock_res, 'setHeader', (key: string, value: string | string[]) => mock_headers[key.toLowerCase()] = value)
            const spy_end = chai.spy.on(mock_res, 'end', () => [''])
            return { mock_res, mock_headers, spy_setHeader, spy_removeHeader, spy_getHeader, spy_hasHeader, spy_getHeaderNames, spy_end, spy_getHeaders, spy_flushHeaders }
        }

        describe('.body', function() {

            const text = '这雨下的可大了，从早上到现在还没停。'
            const buf = Buffer.from('这雨下的可大了，从早上到现在还没停。——这边昨晚上一直下到现在。下雨就凉快了')
            const readable = Readable.from(buf)
            const json = { a: 1, b: 'abc' }

            it('should set body as given', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.body = null
                expect(response.body).to.be.null
                response.body = text
                expect(response.body).to.equal(text)
                response.body = buf
                expect(response.body).to.equal(buf)
                response.body = readable
                expect(response.body).to.equal(readable)
                response.body = json
                expect(response.body).to.equal(json)
            })
        })

        describe('.status', function() {

            it('should return status code of ServerResponse if never set', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(response.status).to.equal(400)
            })

            it('should do nothing if header is sent', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.status = 300
                expect(response.status).to.equal(300)
                ;(mock_res as any).headersSent = true
                response.status = 400
                expect(response.status).to.equal(300)
            })

            it('should throw error if given code is not Integer or out of range [100, 999]', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(() => response.status = 99).to.throw('status code must be an integer within range of [100, 999]')
                expect(() => response.status = 1000).to.throw('status code must be an integer within range of [100, 999]')
                expect(() => response.status = 500.2).to.throw('status code must be an integer within range of [100, 999]')
            })

            it('should set empty string to status message if given status is unknown', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, { version_major: 1 } as any)
                response.status = 404
                expect(response.res.statusMessage).to.equal('Not Found')
                response.status = 999
                expect(response.res.statusMessage).to.equal('')
            })
        })

        describe('.message', function() {

            it('should return statusMessage of ServerResponse if exists', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(response.message).to.equal('Not Found')
            })

            it('should set message by given value', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.message = HTTP_STATUS.message_of(304)
                expect(response.message).to.equal('Not Modified')
            })
        })

        describe('.socket', function() {

            it('should return socket of ServerResponse', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(response.socket).to.equal(mock_res.socket)
            })
        })

        describe('.headers', function() {

            it('should return headers from method getHeaders of ServerResponse', function() {
                const { mock_res, mock_headers, spy_getHeaders } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(response.headers).to.eql(mock_headers)
                expect(spy_getHeaders).to.have.been.called.once
            })
        })

        describe('.writable', function() {

            it('should return false if writableEnded of ServerResponse is true', function() {
                const response = new TpResponse({ writableEnded: true } as any, {} as any)
                expect(response.writable).to.be.false
            })

            it('should return false if finished of ServerResponse is true', function() {
                const response = new TpResponse({ finished: true } as any, {} as any)
                expect(response.writable).to.be.false
            })

            it('should return false if socket not exist', function() {
                const response = new TpResponse({} as any, {} as any)
                expect(response.writable).to.be.false
            })

            it('should return the writable of socket if socket exist', function() {
                expect(new TpResponse({ socket: { writable: true } } as any, {} as any).writable).to.be.true
                expect(new TpResponse({ socket: { writable: false } } as any, {} as any).writable).to.be.false
            })
        })

        describe('.length', function() {

            it('should parse length from header Content-Length', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_headers['content-length'] = '798'
                expect(response.length).to.equal(798)
            })

            it('should return undefined if header Content-Length not exist', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                delete mock_headers['content-length']
                expect(response.length).to.be.undefined
            })

            it('should set Content-Length header', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.length = 111
                expect(mock_headers['content-length']).to.equal('111')
            })

            it('should convert given number to integer', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.length = 111.123
                expect(mock_headers['content-length']).to.equal('111')
            })

            it('should remove header if given undefined', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.length = undefined
                expect(mock_headers['content-length']).to.be.undefined
            })
        })

        describe('.content_type', function() {

            it('should extract type from header Content-Type', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_headers['content-type'] = 'application/json; charset=utf-8'
                expect(response.content_type).to.equal('application/json')
                mock_headers['content-type'] = 'text/plain; charset=utf-8'
                expect(response.content_type).to.equal('text/plain')
            })

            it('should return undefined if header Content-Type not found', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(response.content_type).to.be.undefined
            })

            it('should set type to header Content-Type if given value is MIME type', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.content_type = 'application/json'
                expect(mock_headers['content-type']).to.equal('application/json; charset=utf-8')
            })

            it('should set parsed type to header Content-Type if given value is extname', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.content_type = 'json'
                expect(mock_headers['content-type']).to.equal('application/json; charset=utf-8')
            })

            it('should remove header Content-Type if parse type failed', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.content_type = 'unknown'
                expect(mock_headers['content-type']).to.be.undefined
            })

            it('should remove header if given undefined', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.content_type = undefined
                expect(mock_headers['content-type']).to.be.undefined
            })
        })

        describe('.cache_control', function() {

            it('should parse value of header Cache-Control when accessing', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_headers['cache-control'] = 'public,no-cache,max-age=86400'
                expect(response.cache_control).to.eql({ public: true, 'no-cache': true, 'max-age': 86400 })
            })

            it('should reuse parsed value if Cache-Control not change', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_headers['cache-control'] = 'public,no-cache,max-age=86400'
                const parsed_value = response.cache_control
                expect(response.cache_control).to.equal(parsed_value)
            })

            it('should set Cache-Control header by assign to .cache_control', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.cache_control = { public: true, 'no-cache': true, 'max-age': 86400 }
                expect(mock_headers['cache-control']).to.equal('public,no-cache,max-age=86400')
            })

            it('should remove header if given undefined', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.cache_control = undefined
                expect(mock_headers['cache-control']).to.be.undefined
            })
        })

        describe('.last_modified', function() {

            it('should return timestamp number of header Last-Modified', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_headers['last-modified'] = 'Sat, 05 Nov 2022 15:41:03 GMT'
                expect(response.last_modified).to.equal(1667662863000)
            })

            it('should use first value of header Last-Modified, if it\'s accidentally is an array.', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_headers['last-modified'] = [
                    'Sat, 05 Nov 2022 15:41:03 GMT',
                    'Sat, 06 Nov 2022 15:41:03 GMT',
                ]
                expect(response.last_modified).to.equal(1667662863000)
            })

            it('should return undefined if header not exists', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(response.last_modified).to.be.undefined
            })
        })

        describe('.etag', function() {

            it('should return value of header Etag', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_headers['etag'] = 'W/"bae3a898a842836accb003bafbcbf324"'
                expect(response.etag).to.equal('W/"bae3a898a842836accb003bafbcbf324"')
            })

            it('should use first value of header Etag, if it\'s accidentally is an array.', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_headers['etag'] = [
                    'W/"bae3a898a842836accb003bafbcbf324"',
                    'W/"llllllllll"',
                ]
                expect(response.etag).to.equal('W/"bae3a898a842836accb003bafbcbf324"')
            })

            it('should return undefined if header not exists', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(response.etag).to.be.undefined
            })
        })

        describe('.redirect()', function() {

            it('should set Location and throw TpHttpFinish', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(() => response.redirect('https://www.tarpit.cc/some/where?a=阿拉伯啃大瓜')).to.throw().which.is.instanceof(TpHttpFinish)
                expect(response.get('Location')).to.equal('https://www.tarpit.cc/some/where?a=%E9%98%BF%E6%8B%89%E4%BC%AF%E5%95%83%E5%A4%A7%E7%93%9C')
            })

            it('should use status 302 if not specified', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(() => response.redirect('/some/where')).to.throw().which.is.instanceof(TpHttpFinish)
                expect(response.status).to.equal(302)
            })

            it('should use status 302 if given status is not about redirect', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(() => response.redirect('/some/where', 401)).to.throw().which.is.instanceof(TpHttpFinish)
                expect(response.status).to.equal(302)
            })

            it('should use set status as given', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(() => response.redirect('/some/where', 301)).to.throw().which.is.instanceof(TpHttpFinish)
                expect(response.status).to.equal(301)
            })
        })

        describe('.is()', function() {

            it('should tell whether the value of Content-Type matches given pattern', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.set('Content-Type', 'application/json; charset=utf-8')
                expect(response.is('application/*')).to.equal('application/json')
            })

            it('should return undefined if Content-Type not exists', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(response.is('application/*')).to.be.undefined
            })
        })

        describe('.has()', function() {

            it('should tell whether the value of given header name exists', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.set('Content-Type', 'application/json; charset=utf-8')
                expect(response.has('Content-Type')).to.be.true
                expect(response.has('User-Agent')).to.be.false
            })
        })

        describe('.get()', function() {

            it('should return the value of given header name', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.set('Content-Type', 'application/json; charset=utf-8')
                expect(response.get('Content-Type')).to.equal('application/json; charset=utf-8')
                expect(response.get('User-Agent')).to.be.undefined
            })
        })

        describe('.first()', function() {

            it('should return the first value of if specified header is array', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_headers['custom'] = ['a', 'b']
                expect(response.first('Custom')).to.equal('a')
            })

            it('should return the value self of if specified header is not an array', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_headers['custom'] = 'b'
                expect(response.first('Custom')).to.equal('b')
            })
        })

        describe('.set()', function() {

            it('should do nothing if header is sent', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                ;(mock_res as any).headersSent = true
                response.set('Content-Type', 'application/json; charset=utf-8')
                expect(response.get('Content-Type')).to.be.undefined
            })

            it('should convert elements to string and set to headers if given array', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.set('X-Custom-Number', [1, 2, 3] as any)
                expect(response.get('X-Custom-Number')).to.eql(['1', '2', '3'])
            })

            it('should convert given value to string and set to headers if its not array', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.set('X-Custom-Number', 3)
                expect(response.get('X-Custom-Number')).to.equal('3')
            })

            it('should remove header if given value is undefined', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.set('X-Custom-Number', 3)
                expect(response.get('X-Custom-Number')).to.equal('3')
                response.set('X-Custom-Number', undefined)
                expect(response.get('X-Custom-Number')).to.be.undefined
                expect(response.has('X-Custom-Number')).to.be.false
            })
        })

        describe('.remove()', function() {

            it('should do nothing if header is sent', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_headers['custom-b'] = 'b'
                ;(mock_res as any).headersSent = true
                response.remove('Custom-B')
                expect(response.get('Custom-B')).to.equal('b')
            })

            it('should remove specified header', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_headers['custom-a'] = 'a'
                response.remove('Custom-A')
                expect(response.get('Custom-A')).to.be.undefined
            })
        })

        describe('.append()', function() {

            it('should set value to headers if specified header not exists', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.append('Custom', 'something')
                expect(response.get('Custom')).to.equal('something')
            })

            it('should convert pre-value to array if specified header is not array', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.set('Custom', 'something')
                response.append('Custom', 'a')
                expect(response.get('Custom')).to.eql(['something', 'a'])
            })

            it('should append value to its end if specified header is array', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.set('Custom', ['something', 'a'])
                response.append('Custom', 'b')
                expect(response.get('Custom')).to.eql(['something', 'a', 'b'])
            })
        })

        describe('.clear()', function() {

            it('should clear all headers', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_headers['custom-a'] = 'a'
                mock_headers['custom-b'] = 'b'
                response.clear()
                expect(response.has('Custom-A')).to.be.false
                expect(response.has('Custom-B')).to.be.false
                expect(Object.keys(response.headers)).to.eql([])
            })
        })

        describe('.flush_headers()', function() {

            it('should deliver the call to ServerResponse', function() {
                const { mock_res, spy_flushHeaders } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.flush_headers()
                expect(spy_flushHeaders).to.have.been.called.once
            })
        })
    })
})
