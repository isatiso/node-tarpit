/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { describe, expect, it, vi } from 'vitest'
import { ServerResponse } from 'http'
import { PassThrough, Readable } from 'stream'
import { TpResponse } from '../builtin'
import { flush_response } from './flush-response'

describe('flush-response.ts', function() {

    function mock_response(override: any) {

        const res = { body: undefined, end: () => undefined, getHeaders: () => ({}) } as any as ServerResponse
        const request = {} as any
        const headers = {} as NodeJS.Dict<string | string[]>
        const response = {
            res, headers, request, has: (key: string) => false, get: (key: string) => '', set: (key: string, value: any) => {
            }, remove: (key: string) => {
            }, ...override,
        } as TpResponse
        const spy_end = vi.spyOn(res, 'end' as any).mockImplementation((chunk: any) => (res as any).body = chunk)
        const spy_get_headers = vi.spyOn(res, 'getHeaders' as any).mockImplementation(() => Object.keys(headers))
        const spy_has = vi.spyOn(response, 'has' as any).mockImplementation((key: string) => headers[key.toLowerCase()] !== undefined)
        const spy_get = vi.spyOn(response, 'get' as any).mockImplementation((key: string) => headers[key.toLowerCase()])
        const spy_set = vi.spyOn(response, 'set' as any).mockImplementation((key: string, value) => headers[key.toLowerCase()] = value)
        const spy_remove = vi.spyOn(response, 'remove' as any).mockImplementation((key: string) => delete headers[key.toLowerCase()])
        return { response, request, res, headers, spy_end, spy_has, spy_set, spy_remove, spy_get_headers }
    }

    describe('#flush_response()', function() {

        it('should do nothing if response is not writable', function() {
            flush_response({ writable: false } as any)
        })

        it('should end response with nothing if current status means empty', function() {
            const { response, spy_end } = mock_response({ writable: true, status: 204 })
            flush_response(response)
            expect(spy_end).toHaveBeenCalledOnce()
        })

        it('should just end response if method is HEAD and Content-Length exists', function() {
            const { request, response, headers, spy_end } = mock_response({ writable: true })
            request.method = 'HEAD'
            headers['content-length'] = '123'
            flush_response(response)
            expect(spy_end).toHaveBeenCalledOnce()
        })

        it('should complete message if it is empty', function() {
            const body = Buffer.from('something')
            const { response } = mock_response({ writable: true, body })
            response.status = (response as any)._status = 412
            response.message = ''
            flush_response(response)
            expect(response.message).toEqual('Precondition Failed')
            response.status = (response as any)._status = 865
            response.message = ''
            flush_response(response)
            expect(response.message).toEqual('')
        })

        it('should remove Content-Type and Transfer-Encoding if exists when body is null', function() {
            const { response, spy_end, spy_remove } = mock_response({ writable: true, body: null })
            flush_response(response)
            expect(spy_remove).toHaveBeenCalledWith('Content-Type')
            expect(spy_remove).toHaveBeenCalledWith('Content-Length')
            expect(spy_remove).toHaveBeenCalledWith('Transfer-Encoding')
            expect(spy_end).toHaveBeenCalledOnce()
        })

        it('should keep empty status when body is null and status is already empty', function() {
            const { response, spy_end } = mock_response({ writable: true, body: null })
            response.status = (response as any)._status = 304
            flush_response(response)
            expect(response.status).toEqual(304)
            expect(spy_end).toHaveBeenCalledOnce()
        })

        it('should just flush body when body is Buffer', function() {
            const body = Buffer.from('something')
            const { response, spy_end } = mock_response({ writable: true, body })
            flush_response(response)
            expect(spy_end).toHaveBeenCalledWith(body)
        })

        it('should just flush body when body is string', function() {
            const body = 'something'
            const { response, spy_end } = mock_response({ writable: true, body })
            flush_response(response)
            expect(spy_end).toHaveBeenCalledWith(body)
        })

        it('should pipe body to server response when body is stream', function() {
            const body = Readable.from(Buffer.from('something'))
            const res = new PassThrough()
            const { response } = mock_response({ writable: true, res, body })
            const spy_pipe = vi.spyOn(body, 'pipe')
            flush_response(response)
            expect(spy_pipe).toHaveBeenCalledWith(res)
        })

        it('should not figure out content length when HEAD request and body is stream', function() {
            const body = Readable.from(Buffer.from('something'))
            const res = new PassThrough()
            const { request, response } = mock_response({ writable: true, res, body })
            request.method = 'HEAD'
            flush_response(response)
            expect(response.has('Content-Length')).toBe(false)
        })

        it('should just flush body when body is string', function() {
            const body = { a: 'q', b: 1, c: [], d: '***' }
            const body_str = JSON.stringify(body)
            const { response, spy_end } = mock_response({ writable: true, body })
            flush_response(response)
            expect(response.length).toEqual(Buffer.byteLength(body_str))
            expect(spy_end).toHaveBeenCalledWith(body_str)
        })

        it('should convert DataView to Uint8Array for the response body', function() {
            const body = new Uint32Array(20).fill(89)
            const uint8_body = new Uint8Array(body.buffer)
            const { response, spy_end } = mock_response({ writable: true, body, status: 200 })
            flush_response(response)
            expect(response.body).toEqual(uint8_body)
            expect(spy_end).toHaveBeenCalledWith(uint8_body)
        })

        it('should response HEAD request correctly when body is buffer', function() {
            const body = Buffer.from('something')
            const { request, response, spy_end, res } = mock_response({ writable: true, body })
            request.method = 'HEAD'
            flush_response(response)
            expect(response.get('Content-Length')).toEqual(9)
            expect(spy_end).toHaveBeenCalledOnce()
            expect((res as any).body).toBeUndefined()
        })

        it('should response HEAD request correctly when body is string', function() {
            const body = 'something like you'
            const { request, response, spy_end, res } = mock_response({ writable: true, body })
            request.method = 'HEAD'
            flush_response(response)
            expect(response.get('Content-Length')).toEqual(18)
            expect(spy_end).toHaveBeenCalledOnce()
            expect((res as any).body).toBeUndefined()
        })

        it('should response HEAD request correctly when body is object', function() {
            const body = { obj: 'something like you' }
            const { request, response, spy_end, res } = mock_response({ writable: true, body })
            request.method = 'HEAD'
            flush_response(response)
            expect(response.get('Content-Length')).toEqual(28)
            expect(spy_end).toHaveBeenCalledOnce()
            expect((res as any).body).toBeUndefined()
        })

        it('should response HEAD request correctly when body is Uint8Array', function() {
            const body = new Uint8Array(20)
            body.set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
            const { request, response, spy_end, res } = mock_response({ writable: true, body })
            request.method = 'HEAD'
            flush_response(response)
            expect(response.get('Content-Length')).toEqual(20)
            expect(spy_end).toHaveBeenCalledOnce()
            expect((res as any).body).toBeUndefined()
        })

        it('should response empty body if status represent empty', function() {
            const body = new Uint8Array(20)
            body.set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
            const { response, spy_end, res } = mock_response({ writable: true, body })
            response.status = (response as any)._status = 304
            flush_response(response)
            expect(spy_end).toHaveBeenCalledOnce()
            expect((res as any).body).toBeUndefined()
        })

        it('should handle error event of stream which set to body', function() {
            const body = Readable.from(Buffer.from('something'))
            const res = new PassThrough()
            const { response } = mock_response({ writable: true, res, body })
            flush_response(response)
            body.emit('error')
            expect(response.has('Content-Length')).toBe(false)
        })
    })

    describe('#flush_response() with compression', function() {

        function mock_compressed_response(override: any, accept_encoding: string | string[]) {
            const { response, headers, ...rest } = mock_response(override)
            vi.spyOn(response, 'request', 'get').mockReturnValue({ method: 'GET', get: () => accept_encoding } as any)
            return { response, headers, ...rest }
        }

        it('should not compress when body is below threshold', function() {
            const body = 'short'
            const { response, spy_end } = mock_compressed_response({ writable: true, body }, 'gzip')
            flush_response(response, { enable: true, threshold: 1024 })
            expect(spy_end).toHaveBeenCalledWith('short')
            expect(response.has('Content-Encoding')).toBe(false)
        })

        it('should not compress when compression is disabled', function() {
            const body = 'x'.repeat(2000)
            const { response, spy_end } = mock_compressed_response({ writable: true, body }, 'gzip')
            flush_response(response, { enable: false, threshold: 1024 })
            expect(spy_end).toHaveBeenCalledWith(body)
            expect(response.has('Content-Encoding')).toBe(false)
        })

        it('should not compress when Accept-Encoding has no supported encoding', function() {
            const body = 'x'.repeat(2000)
            const { response, spy_end } = mock_compressed_response({ writable: true, body }, 'deflate')
            flush_response(response, { enable: true, threshold: 1024 })
            expect(spy_end).toHaveBeenCalledWith(body)
            expect(response.has('Content-Encoding')).toBe(false)
        })

        it('should not compress when Content-Encoding is already set', function() {
            const body = 'x'.repeat(2000)
            const { response, headers, spy_end } = mock_compressed_response({ writable: true, body }, 'gzip')
            headers['content-encoding'] = 'identity'
            flush_response(response, { enable: true, threshold: 1024 })
            expect(spy_end).toHaveBeenCalledWith(body)
        })

        it('should compress string body with gzip when above threshold', async function() {
            const body = 'x'.repeat(2000)
            const res = new PassThrough()
            const { response, headers } = mock_compressed_response({ writable: true, body, res }, 'gzip')
            flush_response(response, { enable: true, threshold: 10 })
            expect(headers['content-encoding']).toEqual('gzip')
            expect(headers['content-length']).toBeUndefined()
            await new Promise<void>(resolve => res.once('end', resolve).resume())
        })

        it('should compress string body with br when above threshold', async function() {
            const body = 'x'.repeat(2000)
            const res = new PassThrough()
            const { response, headers } = mock_compressed_response({ writable: true, body, res }, 'br')
            flush_response(response, { enable: true, threshold: 10 })
            expect(headers['content-encoding']).toEqual('br')
            await new Promise<void>(resolve => res.once('end', resolve).resume())
        })

        it('should compress Buffer body when above threshold', async function() {
            const body = Buffer.alloc(2000, 65)
            const res = new PassThrough()
            const { response, headers } = mock_compressed_response({ writable: true, body, res }, 'gzip')
            flush_response(response, { enable: true, threshold: 10 })
            expect(headers['content-encoding']).toEqual('gzip')
            await new Promise<void>(resolve => res.once('end', resolve).resume())
        })

        it('should compress Uint8Array body when above threshold', async function() {
            const body = new Uint8Array(2000).fill(65)
            const res = new PassThrough()
            const { response, headers } = mock_compressed_response({ writable: true, body, res }, 'gzip')
            flush_response(response, { enable: true, threshold: 10 })
            expect(headers['content-encoding']).toEqual('gzip')
            await new Promise<void>(resolve => res.once('end', resolve).resume())
        })

        it('should compress object body when above threshold', async function() {
            const body = { data: 'x'.repeat(2000) }
            const res = new PassThrough()
            const { response, headers } = mock_compressed_response({ writable: true, body, res }, 'gzip')
            flush_response(response, { enable: true, threshold: 10 })
            expect(headers['content-encoding']).toEqual('gzip')
            await new Promise<void>(resolve => res.once('end', resolve).resume())
        })

        it('should compress stream body', async function() {
            const body = Readable.from(Buffer.alloc(2000, 65))
            const res = new PassThrough()
            const { response, headers } = mock_compressed_response({ writable: true, body, res }, 'gzip')
            flush_response(response, { enable: true, threshold: 10 })
            expect(headers['content-encoding']).toEqual('gzip')
            await new Promise<void>(resolve => res.once('end', resolve).resume())
        })

        it('should pipe stream without compression when no matching encoding', async function() {
            const body = Readable.from(Buffer.from('something'))
            const res = new PassThrough()
            const { response } = mock_compressed_response({ writable: true, body, res }, 'deflate')
            const spy_pipe = vi.spyOn(body, 'pipe')
            flush_response(response, { enable: true, threshold: 1 })
            expect(spy_pipe).toHaveBeenCalledWith(res)
        })

        it('should prefer br over gzip when both are accepted', async function() {
            const body = 'x'.repeat(2000)
            const res = new PassThrough()
            const { response, headers } = mock_compressed_response({ writable: true, body, res }, 'gzip, br')
            flush_response(response, { enable: true, threshold: 10 })
            expect(headers['content-encoding']).toEqual('br')
            await new Promise<void>(resolve => res.once('end', resolve).resume())
        })

        it('should handle array Accept-Encoding header', async function() {
            const body = 'x'.repeat(2000)
            const res = new PassThrough()
            const { response, headers } = mock_compressed_response({ writable: true, body, res }, ['gzip', 'br'])
            flush_response(response, { enable: true, threshold: 10 })
            expect(headers['content-encoding']).toEqual('br')
            await new Promise<void>(resolve => res.once('end', resolve).resume())
        })

        it('should not compress when Accept-Encoding header is absent', function() {
            const body = 'x'.repeat(2000)
            const { response, spy_end } = mock_compressed_response({ writable: true, body }, undefined as any)
            flush_response(response, { enable: true, threshold: 10 })
            expect(spy_end).toHaveBeenCalledWith(body)
            expect(response.has('Content-Encoding')).toBe(false)
        })

        it('should call on_error when compressor emits error', async function() {
            const body = Readable.from(Buffer.alloc(2000, 65))
            const res = new PassThrough() as any
            res.getHeaderNames = () => []
            res.removeHeader = () => undefined
            res.setHeader = () => undefined
            res.statusCode = 200
            const { response } = mock_compressed_response({ writable: true, body, res }, 'gzip')
            flush_response(response, { enable: true, threshold: 10 })
            const compressor = (body as any)._readableState.pipes[0]
            compressor.emit('error', new Error('compress error'))
        })
    })
})
