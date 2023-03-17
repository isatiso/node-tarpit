/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData } from '@tarpit/config'
import { Negotiator } from '@tarpit/negotiator'
import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { HttpContext } from '../builtin'
import { TpHttpFinish } from '../errors'
import { HttpBodyFormatter } from './http-body-formatter'

chai.use(cap)

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
        spy_date_now = chai.spy.on(Date, 'now', () => fake_now)
        chai.spy.on(console, 'log', () => undefined)
        formatter = new HttpBodyFormatter(new ConfigData({ http: { expose_error: false } } as any))
    })

    afterEach(function() {
        chai.spy.restore(Date)
        chai.spy.restore(console)
    })

    describe('HttpBodyFormatter', function() {

        describe('.format()', function() {

            it('should format body as simple', async function() {
                const { context } = mock()
                context.result = new TpHttpFinish({ status: 200, code: '200', msg: 'OK', body: { a: 1 } })
                expect(formatter.format(context)).to.eql({ a: 1 })
            })

            it('should format error body as json if preferred', async function() {
                const { context, mock_request } = mock()
                context.result = new TpHttpFinish({ status: 404, code: '404', msg: 'Not Found', body: { a: 1 } })
                const headers = { 'accept': 'application/json' }
                mock_request.accepts = new Negotiator(headers)
                expect(formatter.format(context)).to.eql({ error: { code: '404', msg: 'Not Found' } })
            })

            it('should format error body as text if preferred', async function() {
                const { context, mock_request } = mock()
                context.result = new TpHttpFinish({ status: 404, code: '404', msg: 'Not Found', body: { a: 1 } })
                const headers = { 'accept': 'text/plain' }
                mock_request.accepts = new Negotiator(headers)
                expect(formatter.format(context)).to.eql('Not Found')
            })

            it('should format error body as html if preferred', async function() {
                const { context, mock_request } = mock()
                context.result = new TpHttpFinish({ status: 404, code: '404', msg: 'Not Found', body: { a: 1 } })
                const headers = { 'accept': 'text/html' }
                mock_request.accepts = new Negotiator(headers)
                expect(formatter.format(context)).to.eql('Not Found')
            })
        })
    })
})
