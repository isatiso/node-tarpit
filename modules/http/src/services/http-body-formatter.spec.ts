/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData } from '@tarpit/config'
import { Negotiator } from '@tarpit/negotiator'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpContext } from '../builtin'
import { TpHttpFinish } from '../errors'
import { HttpBodyFormatter } from './http-body-formatter'

describe('http-response-formatter.ts', function() {

    function mock() {
        const mock_response = {} as any
        const mock_request = { ip: '39.88.125.6', method: 'POST', path: '/some/path' } as any
        const context = new HttpContext(mock_request, mock_response)
        return { context, mock_request, mock_response }
    }

    const fake_now = 1657960791441
    let spy_date_now: any

    let formatter: HttpBodyFormatter

    beforeEach(function() {
        spy_date_now = vi.spyOn(Date, 'now').mockImplementation(() => fake_now)
        vi.spyOn(console, 'log').mockImplementation(() => undefined)
        formatter = new HttpBodyFormatter(new ConfigData({ http: { expose_error: false } } as any))
    })

    afterEach(function() {
        vi.restoreAllMocks()
    })

    describe('HttpBodyFormatter', function() {

        describe('.format()', function() {

            it('should format body as simple', async function() {
                const { context } = mock()
                context.result = new TpHttpFinish({ status: 200, code: '200', msg: 'OK', body: { a: 1 } })
                expect(formatter.format(context)).toEqual({ a: 1 })
            })

            it('should format error body as json if preferred', async function() {
                const { context, mock_request } = mock()
                context.result = new TpHttpFinish({ status: 404, code: '404', msg: 'Not Found', body: { a: 1 } })
                mock_request.headers = { 'accept': 'application/json' }
                mock_request.accepts = new Negotiator(mock_request.headers)
                expect(formatter.format(context)).toEqual({ error: { code: '404', msg: 'Not Found' } })
            })

            it('should format error body as text if preferred', async function() {
                const { context, mock_request } = mock()
                context.result = new TpHttpFinish({ status: 404, code: '404', msg: 'Not Found', body: { a: 1 } })
                mock_request.headers = { 'accept': 'text/plain' }
                mock_request.accepts = new Negotiator(mock_request.headers)
                expect(formatter.format(context)).toEqual('Not Found')
            })

            it('should format error body as html if preferred', async function() {
                const { context, mock_request } = mock()
                context.result = new TpHttpFinish({ status: 404, code: '404', msg: 'Not Found', body: { a: 1 } })
                mock_request.headers = { 'accept': 'text/html' }
                mock_request.accepts = new Negotiator(mock_request.headers)
                expect(formatter.format(context)).toEqual('Not Found')
            })
        })
    })
})
