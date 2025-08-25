/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ServerResponse } from 'http'
import { Readable } from 'stream'
import { describe, expect, it, vi } from 'vitest'
import { TpHttpFinish } from '../errors'
import { HTTP_STATUS } from '../tools/http-status'
import { lookup_content_type, TpResponse } from './tp-response'

describe('tp-response.ts', function() {

    describe('#lookup_content_type()', function() {

        it('should cache result of parsing mime types', function() {
            expect(lookup_content_type('json')).toEqual('application/json; charset=utf-8')
        })

        it('should use cache if results exists', function() {
            expect(lookup_content_type('json')).toEqual('application/json; charset=utf-8')
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
            flushHeaders: () => undefined,
            getHeader: () => undefined,
            getHeaderNames: () => [],
            getHeaders: () => ({}),
            hasHeader: () => false,
            removeHeader: () => undefined,
            setHeader: () => undefined,
            end: () => [''],
        } as unknown as ServerResponse

        function mock_server_response() {
            const mock_res = { ...origin_mocked_server_response, socket: { encrypted: undefined, writable: true } } as unknown as ServerResponse
            const mock_headers: any = {}
            const spy_flushHeaders = vi.spyOn(mock_res, 'flushHeaders')
            const spy_getHeader = vi.spyOn(mock_res, 'getHeader').mockImplementation((key: string) => mock_headers[key.toLowerCase()])
            const spy_getHeaderNames = vi.spyOn(mock_res, 'getHeaderNames').mockImplementation(() => Object.keys(mock_headers))
            const spy_getHeaders = vi.spyOn(mock_res, 'getHeaders').mockImplementation(() => mock_headers)
            const spy_hasHeader = vi.spyOn(mock_res, 'hasHeader').mockImplementation((key: string) => mock_headers[key.toLowerCase()] !== undefined)
            const spy_removeHeader = vi.spyOn(mock_res, 'removeHeader').mockImplementation((key: string) => delete mock_headers[key.toLowerCase()])
            const spy_setHeader = vi.spyOn(mock_res, 'setHeader').mockImplementation((key: string, value: number | string | readonly string[]) => {
                mock_headers[key.toLowerCase()] = value
                return mock_res
            })
            const spy_end = vi.spyOn(mock_res, 'end' as any)
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
                expect(response.body).toBeNull()
                response.body = text
                expect(response.body).toEqual(text)
                response.body = buf
                expect(response.body).toEqual(buf)
                response.body = readable
                expect(response.body).toEqual(readable)
                response.body = json
                expect(response.body).toEqual(json)
            })
        })

        describe('.status', function() {

            it('should return status code of ServerResponse if never set', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(response.status).toEqual(400)
            })

            it('should do nothing if header is sent', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.status = 300
                expect(response.status).toEqual(300)
                ;(mock_res as any).headersSent = true
                response.status = 400
                expect(response.status).toEqual(300)
            })

            it('should throw error if given code is not Integer or out of range [100, 999]', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(() => response.status = 99).toThrow('status code must be an integer within range of [100, 999]')
                expect(() => response.status = 1000).toThrow('status code must be an integer within range of [100, 999]')
                expect(() => response.status = 500.2).toThrow('status code must be an integer within range of [100, 999]')
            })

            it('should set empty string to status message if given status is unknown', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, { version_major: 1 } as any)
                response.status = 404
                expect(response.res.statusMessage).toEqual('Not Found')
                response.status = 999
                expect(response.res.statusMessage).toEqual('')
            })
        })

        describe('.message', function() {

            it('should return statusMessage of ServerResponse if exists', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(response.message).toEqual('Not Found')
            })

            it('should set message by given value', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.message = HTTP_STATUS.message_of(304)
                expect(response.message).toEqual('Not Modified')
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
                expect(response.headers).toEqual(mock_headers)
                expect(spy_getHeaders).toHaveBeenCalledOnce()
            })
        })

        describe('.writable', function() {

            it('should return false if writableEnded of ServerResponse is true', function() {
                const response = new TpResponse({ writableEnded: true } as any, {} as any)
                expect(response.writable).toBe(false)
            })

            it('should return false if finished of ServerResponse is true', function() {
                const response = new TpResponse({ finished: true } as any, {} as any)
                expect(response.writable).toBe(false)
            })

            it('should return false if socket not exist', function() {
                const response = new TpResponse({} as any, {} as any)
                expect(response.writable).toBe(false)
            })

            it('should return the writable of socket if socket exist', function() {
                expect(new TpResponse({ socket: { writable: true } } as any, {} as any).writable).toBe(true)
                expect(new TpResponse({ socket: { writable: false } } as any, {} as any).writable).toBe(false)
            })
        })

        describe('.length', function() {

            it('should parse length from header Content-Length', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_headers['content-length'] = '798'
                expect(response.length).toEqual(798)
            })

            it('should return undefined if header Content-Length not exist', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                delete mock_headers['content-length']
                expect(response.length).toBeUndefined()
            })

            it('should set Content-Length header', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.length = 111
                expect(mock_headers['content-length']).toEqual('111')
            })

            it('should convert given number to integer', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.length = 111.123
                expect(mock_headers['content-length']).toEqual('111')
            })

            it('should remove header if given undefined', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.length = undefined
                expect(mock_headers['content-length']).toBeUndefined()
            })
        })

        describe('.content_type', function() {

            it('should extract type from header Content-Type', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_headers['content-type'] = 'application/json; charset=utf-8'
                expect(response.content_type).toEqual('application/json')
                mock_headers['content-type'] = 'text/plain; charset=utf-8'
                expect(response.content_type).toEqual('text/plain')
            })

            it('should return undefined if header Content-Type not found', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(response.content_type).toBeUndefined()
            })

            it('should set type to header Content-Type if given value is MIME type', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.content_type = 'application/json'
                expect(mock_headers['content-type']).toEqual('application/json; charset=utf-8')
            })

            it('should set parsed type to header Content-Type if given value is extname', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.content_type = 'json'
                expect(mock_headers['content-type']).toEqual('application/json; charset=utf-8')
            })

            it('should remove header Content-Type if parse type failed', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.content_type = 'unknown'
                expect(mock_headers['content-type']).toBeUndefined()
            })

            it('should remove header if given undefined', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.content_type = undefined
                expect(mock_headers['content-type']).toBeUndefined()
            })
        })

        describe('.cache_control', function() {

            it('should parse value of header Cache-Control when accessing', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_headers['cache-control'] = 'public,no-cache,max-age=86400'
                expect(response.cache_control).toEqual({ public: true, 'no-cache': true, 'max-age': 86400 })
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
                expect(mock_headers['cache-control']).toEqual('public,no-cache,max-age=86400')
            })

            it('should remove header if given undefined', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.cache_control = undefined
                expect(mock_headers['cache-control']).toBeUndefined()
            })
        })

        describe('.last_modified', function() {

            it('should return timestamp number of header Last-Modified', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_headers['last-modified'] = 'Sat, 05 Nov 2022 15:41:03 GMT'
                expect(response.last_modified).toEqual(1667662863000)
            })

            it('should use first value of header Last-Modified, if it\'s accidentally is an array.', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_headers['last-modified'] = [
                    'Sat, 05 Nov 2022 15:41:03 GMT',
                    'Sat, 06 Nov 2022 15:41:03 GMT',
                ]
                expect(response.last_modified).toEqual(1667662863000)
            })

            it('should return undefined if header not exists', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(response.last_modified).toBeUndefined()
            })
        })

        describe('.etag', function() {

            it('should return value of header Etag', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_headers['etag'] = 'W/"bae3a898a842836accb003bafbcbf324"'
                expect(response.etag).toEqual('W/"bae3a898a842836accb003bafbcbf324"')
            })

            it('should use first value of header Etag, if it\'s accidentally is an array.', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_headers['etag'] = [
                    'W/"bae3a898a842836accb003bafbcbf324"',
                    'W/"llllllllll"',
                ]
                expect(response.etag).toEqual('W/"bae3a898a842836accb003bafbcbf324"')
            })

            it('should return undefined if header not exists', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(response.etag).toBeUndefined()
            })
        })

        describe('.redirect()', function() {

            it('should set Location and throw TpHttpFinish', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(() => response.redirect('https://www.tarpit.cc/some/where?a=阿拉伯啃大瓜')).toThrow(TpHttpFinish)
                expect(response.get('Location')).toEqual('https://www.tarpit.cc/some/where?a=%E9%98%BF%E6%8B%89%E4%BC%AF%E5%95%83%E5%A4%A7%E7%93%9C')
            })

            it('should use status 302 if not specified', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(() => response.redirect('/some/where')).toThrow(TpHttpFinish)
                expect(response.status).toEqual(302)
            })

            it('should use status 302 if given status is not about redirect', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(() => response.redirect('/some/where', 401)).toThrow(TpHttpFinish)
                expect(response.status).toEqual(302)
            })

            it('should use set status as given', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(() => response.redirect('/some/where', 301)).toThrow(TpHttpFinish)
                expect(response.status).toEqual(301)
            })
        })

        describe('.is()', function() {

            it('should tell whether the value of Content-Type matches given pattern', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.set('Content-Type', 'application/json; charset=utf-8')
                expect(response.is('application/*')).toEqual('application/json')
            })

            it('should return undefined if Content-Type not exists', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                expect(response.is('application/*')).toBeUndefined()
            })
        })

        describe('.has()', function() {

            it('should tell whether the value of given header name exists', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.set('Content-Type', 'application/json; charset=utf-8')
                expect(response.has('Content-Type')).toBe(true)
                expect(response.has('User-Agent')).toBe(false)
            })
        })

        describe('.get()', function() {

            it('should return the value of given header name', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.set('Content-Type', 'application/json; charset=utf-8')
                expect(response.get('Content-Type')).toEqual('application/json; charset=utf-8')
                expect(response.get('User-Agent')).toBeUndefined()
            })
        })

        describe('.first()', function() {

            it('should return the first value of if specified header is array', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_headers['custom'] = ['a', 'b']
                expect(response.first('Custom')).toEqual('a')
            })

            it('should return the value self of if specified header is not an array', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_headers['custom'] = 'b'
                expect(response.first('Custom')).toEqual('b')
            })
        })

        describe('.set()', function() {

            it('should do nothing if header is sent', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                ;(mock_res as any).headersSent = true
                response.set('Content-Type', 'application/json; charset=utf-8')
                expect(response.get('Content-Type')).toBeUndefined()
            })

            it('should convert elements to string and set to headers if given array', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.set('X-Custom-Number', [1, 2, 3] as any)
                expect(response.get('X-Custom-Number')).toEqual(['1', '2', '3'])
            })

            it('should convert given value to string and set to headers if its not array', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.set('X-Custom-Number', 3)
                expect(response.get('X-Custom-Number')).toEqual('3')
            })

            it('should remove header if given value is undefined', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.set('X-Custom-Number', 3)
                expect(response.get('X-Custom-Number')).toEqual('3')
                response.set('X-Custom-Number', undefined)
                expect(response.get('X-Custom-Number')).toBeUndefined()
                expect(response.has('X-Custom-Number')).toBe(false)
            })
        })

        describe('.remove()', function() {

            it('should do nothing if header is sent', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_headers['custom-b'] = 'b'
                ;(mock_res as any).headersSent = true
                response.remove('Custom-B')
                expect(response.get('Custom-B')).toEqual('b')
            })

            it('should remove specified header', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_headers['custom-a'] = 'a'
                response.remove('Custom-A')
                expect(response.get('Custom-A')).toBeUndefined()
            })
        })

        describe('.append()', function() {

            it('should set value to headers if specified header not exists', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.append('Custom', 'something')
                expect(response.get('Custom')).toEqual('something')
            })

            it('should convert pre-value to array if specified header is not array', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.set('Custom', 'something')
                response.append('Custom', 'a')
                expect(response.get('Custom')).toEqual(['something', 'a'])
            })

            it('should append value to its end if specified header is array', function() {
                const { mock_res } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.set('Custom', ['something', 'a'])
                response.append('Custom', 'b')
                expect(response.get('Custom')).toEqual(['something', 'a', 'b'])
            })
        })

        describe('.clear()', function() {

            it('should clear all headers', function() {
                const { mock_res, mock_headers } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                mock_headers['custom-a'] = 'a'
                mock_headers['custom-b'] = 'b'
                response.clear()
                expect(response.has('Custom-A')).toBe(false)
                expect(response.has('Custom-B')).toBe(false)
                expect(Object.keys(response.headers)).toEqual([])
            })
        })

        describe('.flush_headers()', function() {

            it('should deliver the call to ServerResponse', function() {
                const { mock_res, spy_flushHeaders } = mock_server_response()
                const response = new TpResponse(mock_res, {} as any)
                response.flush_headers()
                expect(spy_flushHeaders).toHaveBeenCalledOnce()
            })
        })
    })
})
