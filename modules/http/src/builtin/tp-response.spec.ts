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
import { Finish } from '../errors'
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
            statusCode: 200,
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

            it('should set to body if given null and set 204 to status if not set yet', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.body = null
                expect(response.body).to.be.null
                expect(response.status).to.equal(204)
                response.body = undefined
                expect(response.body).to.be.undefined
                expect(response.status).to.equal(204)
            })

            it('should remove headers: Content-Type, Content-Length, Transfer-Encoding', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                const spy_remove = chai.spy.on(response, 'remove', () => undefined)
                response.body = null
                expect(spy_remove).to.have.been.first.called.with('Content-Type')
                expect(spy_remove).to.have.been.second.called.with('Content-Length')
                expect(spy_remove).to.have.been.third.called.with('Transfer-Encoding')
            })

            it('should set body as given string', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.body = text
                expect(response.body).to.equal(text)
                expect(response.status).to.equal(200)
            })

            it('should set Content-Type as text/plain if given string', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.body = text
                expect(response.get('Content-Type')).to.equal('text/plain; charset=utf-8')
            })

            it('should figure out content length and set it to header', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.body = text
                expect(response.get('Content-Length')).to.equal('54')
            })

            it('should set body as given Buffer', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.body = buf
                expect(response.body).to.equal(buf)
                expect(response.status).to.equal(200)
            })

            it('should set Content-Type as application/octet-stream if given Buffer', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.body = buf
                expect(response.get('Content-Type')).to.equal('application/octet-stream')
            })

            it('should figure out content length and set it to header', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.body = buf
                expect(response.get('Content-Length')).to.equal('114')
            })

            it('should set body as given Stream', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.body = readable
                expect(response.body).to.equal(readable)
                expect(response.status).to.equal(200)
            })

            it('should skip stream process if given stream as same as pre-body', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                const spy_remove = chai.spy.on(response, 'remove', () => undefined)
                response.body = readable
                expect(spy_remove).to.have.been.called.once
                response.body = readable
                expect(spy_remove).to.have.been.called.once
                expect(response.body).to.equal(readable)
                expect(response.status).to.equal(200)
            })

            it('should set Content-Type as application/octet-stream if given Stream', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.body = readable
                expect(response.get('Content-Type')).to.equal('application/octet-stream')
            })

            it('should handle error event of stream which set to body', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.body = readable
                readable.emit('error')
            })

            it('should remove header Content-Length if last value is not null', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                const spy_remove = chai.spy.on(response, 'remove', () => undefined)
                response.body = 'some thing'
                response.body = readable
                expect(spy_remove).to.have.been.first.called.with('Content-Length')
            })

            it('should treat other value as json object', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.body = json
                expect(response.body).to.equal(json)
                expect(response.status).to.equal(200)
            })

            it('should set Content-Type as application/json if given JSON object', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.body = json
                expect(response.get('Content-Type')).to.equal('application/json; charset=utf-8')
            })

            it('should remove header Content-Length if given json', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                const spy_remove = chai.spy.on(response, 'remove', () => undefined)
                response.body = json
                expect(spy_remove).to.have.been.first.called.with('Content-Length')
            })
        })

        describe('.status', function() {

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

            it('should remove exist body if given status means empty', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.body = 'abc'
                expect(response.status).to.equal(200)
                expect(response.body).to.equal('abc')
                response.status = 204
                expect(response.status).to.equal(204)
                expect(response.body).to.be.null
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

            it('should return statusMessage of status code if exists', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_res.statusCode = 304
                response.message = ''
                expect(response.message).to.equal('Not Modified')
            })

            it('should return empty string if last to action failed', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_res.statusCode = 999
                response.message = ''
                expect(response.message).to.equal('')
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

            it('should ignore given value if Transfer-Encoding header exists', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_headers['transfer-encoding'] = 'gzip'
                mock_headers['content-length'] = '2'
                response.length = 111
                expect(mock_headers['content-length']).to.equal('2')
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
        })

        describe('.set_content_type()', function() {

            it('should set type to header Content-Type if given value is MIME type', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.set_content_type('application/json')
                expect(mock_headers['content-type']).to.equal('application/json; charset=utf-8')
            })

            it('should set parsed type to header Content-Type if given value is extname', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.set_content_type('json')
                expect(mock_headers['content-type']).to.equal('application/json; charset=utf-8')
            })

            it('should remove header Content-Type if parse type failed', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.set_content_type('unknown')
                expect(mock_headers['content-type']).to.be.undefined
            })
        })

        describe('.figure_out_length()', function() {

            it('should return current length if Transfer-Encoding exists', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.set('Transfer-Encoding', 'gzip')
                expect(response.figure_out_length()).to.be.undefined
                expect(response.length).to.be.undefined
            })

            it('should return undefined if Content-Length not exists and body not exists', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(response.figure_out_length()).to.be.undefined
                expect(response.length).to.be.undefined
            })

            it('should return undefined if Content-Length not exists and body is Stream', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.body = Readable.from(Buffer.from('lkj'))
                expect(response.figure_out_length()).to.be.undefined
                expect(response.length).to.be.undefined
            })

            it('should return compute length of body if Content-Length not exists and body is string', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.body = '1234567890'
                delete mock_headers['content-length']
                expect(response.figure_out_length()).to.equal(10)
                expect(response.length).to.equal(10)
            })

            it('should return compute length of body if Content-Length not exists and body is Buffer', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.body = Buffer.from('1234567890')
                delete mock_headers['content-length']
                expect(response.figure_out_length()).to.equal(10)
                expect(response.length).to.equal(10)
            })

            it('should return compute length of JSON serialized body if Content-Length not exists and body is object', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.body = { a: '阿瑟费', b: 111 }
                delete mock_headers['content-length']
                expect(response.figure_out_length()).to.equal(25)
                expect(response.length).to.equal(25)
            })
        })

        describe('.redirect()', function() {

            it('should set Location and throw Finish', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(() => response.redirect('https://www.tarpit.cc/some/where?a=阿拉伯啃大瓜')).to.throw().which.is.instanceof(Finish)
                expect(response.get('Location')).to.equal('https://www.tarpit.cc/some/where?a=%E9%98%BF%E6%8B%89%E4%BC%AF%E5%95%83%E5%A4%A7%E7%93%9C')
            })

            it('should use status 302 if not specified', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(() => response.redirect('/some/where')).to.throw().which.is.instanceof(Finish)
                expect(response.status).to.equal(302)
            })

            it('should use status 302 if given status is not about redirect', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(() => response.redirect('/some/where', 401)).to.throw().which.is.instanceof(Finish)
                expect(response.status).to.equal(302)
            })

            it('should use set status as given', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(() => response.redirect('/some/where', 301)).to.throw().which.is.instanceof(Finish)
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
