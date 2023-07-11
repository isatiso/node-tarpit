/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Dora } from '@tarpit/dora'
import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import chai_spies from 'chai-spies'
import { HttpContext } from '../builtin'
import { TpHttpFinish } from '../errors'
import { assemble_duration, create_request_log, HttpHooks } from './http-hooks'

chai.use(cap)
chai.use(chai_spies)

describe('http-hooks.ts', function() {

    function mock() {
        const mock_response = {} as any
        const spy_response_set = chai.spy.on(mock_response, 'set', () => undefined)
        const mock_request = { ip: '39.88.125.6', method: 'POST', path: '/some/path' } as any
        const context = new HttpContext(mock_request, mock_response)
        const spy_get = chai.spy.on(context, 'get')
        const spy_set = chai.spy.on(context, 'set')
        return { context, mock_request, mock_response, spy_response_set, spy_get, spy_set }
    }

    function redo_spy_console() {
        sandbox.restore()
        sandbox.on(console, ['debug', 'log', 'info', 'warn', 'error'], () => undefined)
    }

    const fake_now = 1657960791441
    const time_str = new Dora(fake_now).format('YYYY-MM-DDTHH:mm:ssZZ')
    const sandbox = chai.spy.sandbox()

    before(function() {
        chai.spy.on(Date, 'now', () => fake_now)
        sandbox.on(console, ['debug', 'log', 'info', 'warn', 'error'], () => undefined)
    })

    after(function() {
        chai.spy.restore(Date)
        sandbox.restore()
    })

    beforeEach(function() {
        redo_spy_console()
    })

    describe('#assemble_duration()', function() {

        it('should get start time from context and figure out duration and set to response header X-Duration', function() {
            const { context, spy_get, spy_response_set } = mock()
            context.set('process_start', fake_now - 1000)
            assemble_duration(context)
            expect(spy_get).to.have.been.called.with('process_start')
            expect(spy_response_set).to.have.been.called.with('X-Duration', 1000)
        })

        it('should set -1 to response header X-Duration if process_start not exists', function() {
            const { context, spy_get, spy_response_set } = mock()
            assemble_duration(context)
            expect(spy_get).to.have.been.called.with('process_start')
            expect(spy_response_set).to.have.been.called.with('X-Duration', -1)
        })
    })

    describe('#create_request_log()', function() {

        it('should create log message by assemble prop of request object', function() {
            const { context } = mock()
            context.set('process_start', fake_now - 996)
            context.response.status = 200
            create_request_log(context, 996)
            expect(console.info).to.have.been.first.called.with(`[${time_str}]39.88.125.6           996ms POST    200 `, '/some/path')
        })

        it('should set method as "-" if method is undefined', function() {
            const { context, mock_request } = mock()
            context.set('process_start', fake_now - 996)
            context.response.status = 200
            mock_request.method = undefined
            mock_request.ip = '127.0.0.1'
            create_request_log(context, 996)
            expect(console.info).to.have.been.first.called.with(`[${time_str}]127.0.0.1             996ms -       200 `, '/some/path')
        })

        it('should log detail of CrashError', function() {
            const { context } = mock()
            context.set('process_start', fake_now - 996)
            context.result = new TpHttpFinish({ status: 500, code: '500', msg: 'Internal Server Error' })
            context.response.status = 500
            create_request_log(context, 996)
            expect(console.info).to.have.been.first.called.with(`[${time_str}]39.88.125.6           996ms POST    500 `, '/some/path', '<500 Internal Server Error>')
        })

        it('should log detail of StandardError', function() {
            const { context } = mock()
            context.set('process_start', fake_now - 996)
            context.result = new TpHttpFinish({ status: 401, code: '401', msg: 'Unauthorized' })
            context.response.status = 401
            create_request_log(context, 996)
            expect(console.info).to.have.been.first.called.with(`[${time_str}]39.88.125.6           996ms POST    401 `, '/some/path', '<401 Unauthorized>')
        })
    })

    describe('HttpHooks', function() {

        describe('.on_init()', function() {

            it('should set process_start to context', async function() {
                const { context, spy_set } = mock()
                await new HttpHooks().on_init(context)
                expect(spy_set).to.have.been.called.with('process_start', fake_now)
            })
        })

        describe('.on_finish()', function() {

            it('should create log', async function() {
                const { context } = mock()
                context.set('process_start', fake_now - 996)
                context.response.status = 200
                await new HttpHooks().on_finish(context)
                expect(console.info).to.have.been.first.called.with(`[${time_str}]39.88.125.6           996ms POST    200 `, '/some/path')
            })
        })

        describe('.on_error()', function() {

            it('should create log', async function() {
                const { context } = mock()
                context.set('process_start', fake_now - 996)
                context.result = new TpHttpFinish({ status: 404, code: '404', msg: 'Not Found' })
                context.response.status = 404
                await new HttpHooks().on_error(context)
                expect(console.info).to.have.been.first.called.with(`[${time_str}]39.88.125.6           996ms POST    404 `, '/some/path', '<404 Not Found>')
            })
        })
    })
})
