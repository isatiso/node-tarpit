/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { describe, expect, it, vi } from 'vitest'
import { TpHttpFinish } from '../errors'
import { on_error } from './on-error'

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
                end: () => undefined
            }
            const spy = vi.spyOn(mock_response, 'end')
            on_error({ stack: 'stack' }, mock_response as any)
            expect(spy).toHaveBeenCalledOnce()
            expect(spy).toHaveBeenCalledWith('stack')
        })

        it('should write stringify error to res if error occurred and header is sent and res is writable and error had no property stack', function() {
            const mock_response = {
                headersSent: true,
                writable: true,
                end: () => undefined
            }
            const spy = vi.spyOn(mock_response, 'end')
            on_error({ a: 'lkj' }, mock_response as any)
            expect(spy).toHaveBeenCalledOnce()
            expect(spy).toHaveBeenCalledWith('[object Object]')
        })

        it('should remove all old headers on error occurred', function() {
            const mock_response = {
                headersSent: false,
                writable: true,
                end: () => undefined,
                setHeader: () => undefined,
                getHeaderNames: () => ['content-type', 'content-length'],
                removeHeader: () => undefined
            }
            const get_headers_spy = vi.spyOn(mock_response, 'getHeaderNames')
            const remove_header_spy = vi.spyOn(mock_response, 'removeHeader')
            on_error({ a: 'lkj' }, mock_response as any)
            expect(get_headers_spy).toHaveBeenCalledOnce()
            expect(remove_header_spy).toHaveBeenCalledTimes(2)
            expect(remove_header_spy).toHaveBeenCalledWith('content-type')
            expect(remove_header_spy).toHaveBeenCalledWith('content-length')
        })

        it('should set headers from err specified', function() {
            const mock_response = {
                headersSent: false,
                writable: true,
                end: () => undefined,
                getHeaderNames: () => ['content-type', 'content-length'],
                removeHeader: () => undefined,
                setHeader: () => undefined
            }
            const set_header_spy = vi.spyOn(mock_response, 'setHeader')
            on_error(new TpHttpFinish({ code: '', msg: '', status: 500, headers: { reason: 'reason something', mixin: 'mixin' } }), mock_response as any)
            expect(set_header_spy).toHaveBeenCalledTimes(4)
            expect(set_header_spy).toHaveBeenCalledWith('reason', 'reason something')
            expect(set_header_spy).toHaveBeenCalledWith('mixin', 'mixin')
        })

        it('should set content-type and content-length to headers', function() {
            const mock_error = new TpHttpFinish({ code: '', msg: 'something', status: 500, headers: { reason: 'reason something', mixin: 'mixin' } })
            const mock_response = {
                headersSent: false,
                writable: true,
                end: () => undefined,
                getHeaderNames: () => ['content-type', 'content-length'],
                removeHeader: () => undefined,
                setHeader: () => undefined
            }
            const jsonify_spy = vi.spyOn(mock_error, 'jsonify')
            const set_header_spy = vi.spyOn(mock_response, 'setHeader')
            const end_spy = vi.spyOn(mock_response, 'end')
            on_error(mock_error, mock_response as any)
            expect(jsonify_spy).toHaveBeenCalledOnce()
            expect(set_header_spy).toHaveBeenCalledTimes(4)
            expect(set_header_spy).toHaveBeenCalledWith('content-type', 'application/json; charset=utf-8')
            expect(set_header_spy).toHaveBeenCalledWith('content-length', 109)
            expect(end_spy).toHaveBeenCalledOnce()
        })
    })
})
