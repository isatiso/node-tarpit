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
import { TpHttpError } from '../errors'
import { on_error } from './on-error'

chai.use(cap)
chai.use(chai_spies)

describe('on-error.ts', function() {

    describe('#on_error()', function() {

        it('should do nothing if given err is empty', function() {
            on_error(undefined, null as any)
        })

        it('should do nothing if header is sent and not writable', function() {
            on_error({}, { headersSent: true, writable: false } as any)
        })

        it('should write stack error to res if error occurred and header is sent and res is writable', function() {
            const mock_response = {
                headersSent: true,
                writable: true,
            }
            const spy = chai.spy.on(mock_response, 'end', (_chunk: string) => undefined)
            on_error({ stack: 'stack' }, mock_response as any)
            expect(spy).to.have.been.called.once
            expect(spy).to.have.been.first.called.with('stack')
        })

        it('should write stringify error to res if error occurred and header is sent and res is writable and error had no property stack', function() {
            const mock_response = {
                headersSent: true,
                writable: true,
            }
            const spy = chai.spy.on(mock_response, 'end', (_chunk: string) => undefined)
            on_error({ a: 'lkj' }, mock_response as any)
            expect(spy).to.have.been.called.once
            expect(spy).to.have.been.first.called.with('[object Object]')
        })

        it('should remove all old headers on error occurred', function() {
            const mock_response = {
                headersSent: false,
                writable: true,
            }
            chai.spy.on(mock_response, 'end', (_chunk: string) => undefined)
            chai.spy.on(mock_response, 'setHeader', (_key: string, _value: string) => undefined)
            const get_headers_spy = chai.spy.on(mock_response, 'getHeaderNames', () => ['content-type', 'content-length'])
            const remove_header_spy = chai.spy.on(mock_response, 'removeHeader', (_key: string) => undefined)
            on_error({ a: 'lkj' }, mock_response as any)
            expect(get_headers_spy).to.have.been.called.once
            expect(remove_header_spy).to.have.been.called.twice
            expect(remove_header_spy).to.have.been.first.called.with('content-type')
            expect(remove_header_spy).to.have.been.second.called.with('content-length')
        })

        it('should set headers from err specified', function() {
            const mock_response = { headersSent: false, writable: true }
            chai.spy.on(mock_response, 'end', (_chunk: string) => undefined)
            chai.spy.on(mock_response, 'getHeaderNames', () => ['content-type', 'content-length'])
            chai.spy.on(mock_response, 'removeHeader', (_key: string) => undefined)
            const set_header_spy = chai.spy.on(mock_response, 'setHeader', (_key: string, _value: string) => undefined)
            on_error(new TpHttpError({ code: '', msg: '', status: 500, headers: { reason: 'reason something', mixin: 'mixin' } }), mock_response as any)
            expect(set_header_spy).to.have.been.called.exactly(4)
            expect(set_header_spy).to.have.been.called.with('reason', 'reason something')
            expect(set_header_spy).to.have.been.called.with('mixin', 'mixin')
        })

        it('should set content-type and content-length to headers', function() {
            const mock_error = new TpHttpError({ code: '', msg: 'something', status: 500, headers: { reason: 'reason something', mixin: 'mixin' } })
            const mock_response = { headersSent: false, writable: true }
            const jsonify_spy = chai.spy.on(mock_error, 'jsonify')
            const set_header_spy = chai.spy.on(mock_response, 'setHeader', (_key: string, _value: string) => undefined)
            const end_spy = chai.spy.on(mock_response, 'end', (_chunk: string) => undefined)
            chai.spy.on(mock_response, 'getHeaderNames', () => ['content-type', 'content-length'])
            chai.spy.on(mock_response, 'removeHeader', (_key: string) => undefined)
            on_error(mock_error, mock_response as any)
            expect(jsonify_spy).to.have.been.called.once
            expect(set_header_spy).to.have.been.called.exactly(4)
            expect(set_header_spy).to.have.been.called.with('content-type', 'application/json; charset=utf-8')
            expect(set_header_spy).to.have.been.called.with('content-length', 119)
            expect(end_spy).to.have.been.called.once
        })
    })
})
