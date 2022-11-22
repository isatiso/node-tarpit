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
import { PassThrough, Readable } from 'stream'
import { TpResponse } from '../builtin'
import { flush_response } from './flush-response'

chai.use(cap)
chai.use(chai_spies)

describe('flush-response.ts', function() {

    function mock_response(override: any) {
        const res = {} as ServerResponse
        const request = {} as any
        const headers = {} as NodeJS.Dict<string | string[]>
        const response = { res, headers, request, ...override, } as TpResponse
        const spy_end = chai.spy.on(res, 'end', () => undefined)
        const spy_get_headers = chai.spy.on(res, 'getHeaders', () => Object.keys(headers))
        const spy_has = chai.spy.on(response, 'has', (key: string) => headers[key.toLowerCase()] !== undefined)
        const spy_set = chai.spy.on(response, 'set', (key: string, value) => headers[key.toLowerCase()] = value)
        const spy_remove = chai.spy.on(response, 'remove', (key: string) => headers[key.toLowerCase()] !== undefined)
        return { response, request, res, headers, spy_end, spy_has, spy_set, spy_remove, spy_get_headers }
    }

    describe('#flush_response()', function() {

        it('should do nothing if response is not writable', function() {
            flush_response({ writable: false } as any)
        })

        it('should end response with nothing if current status means empty', function() {
            const { response, spy_end } = mock_response({ writable: true, status: 204 })
            flush_response(response)
            expect(spy_end).to.have.been.called.once
        })

        it('should just end response if method is HEAD and Content-Length exists', function() {
            const { request, response, headers, spy_end } = mock_response({ writable: true })
            request.method = 'HEAD'
            headers['content-length'] = '123'
            flush_response(response)
            expect(spy_end).to.have.been.called.once
        })

        it('should complete message if it is empty', function() {
            const body = Buffer.from('something')
            const { response } = mock_response({ writable: true, body })
            response.status = 412
            response.message = ''
            flush_response(response)
            expect(response.message).to.equal('Precondition Failed')
        })

        it('should remove Content-Type and Transfer-Encoding if exists when body is null', function() {
            const { response, spy_end, spy_remove } = mock_response({ writable: true, body: null })
            flush_response(response)
            expect(spy_remove).to.have.been.first.called.with('Content-Type')
            expect(spy_remove).to.have.been.second.called.with('Transfer-Encoding')
            expect(spy_end).to.have.been.called.once
        })

        it('should just flush body when body is Buffer', function() {
            const body = Buffer.from('something')
            const { response, spy_end } = mock_response({ writable: true, body })
            flush_response(response)
            expect(spy_end).to.have.been.called.with(body)
        })

        it('should just flush body when body is string', function() {
            const body = 'something'
            const { response, spy_end } = mock_response({ writable: true, body })
            flush_response(response)
            expect(spy_end).to.have.been.called.with(body)
        })

        it('should pipe body to server response when body is stream', function() {
            const body = Readable.from(Buffer.from('something'))
            const res = new PassThrough()
            const { response } = mock_response({ writable: true, res, body })
            const spy_pipe = chai.spy.on(body, 'pipe', (_value: any) => undefined)
            flush_response(response)
            expect(spy_pipe).to.have.been.called.with(res)
        })

        it('should just flush body when body is string', function() {
            const body = { a: 'q', b: 1, c: [], d: '***' }
            const body_str = JSON.stringify(body)
            const { response, spy_end } = mock_response({ writable: true, body })
            flush_response(response)
            expect(response.length).to.equal(Buffer.byteLength(body_str))
            expect(spy_end).to.have.been.called.with(body_str)
        })
    })
})
