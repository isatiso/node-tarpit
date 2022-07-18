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
import { BusinessError, CrashError, StandardError } from '../errors'
import { assemble_duration, create_log, HttpHooks } from './http-hooks'

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

    const fake_now = 1657960791441
    const time_str = new Dora(fake_now).format('YYYY-MM-DDTHH:mm:ssZZ')
    let spy_date_now: any
    let spy_console_log: any

    beforeEach(function() {
        spy_date_now = chai.spy.on(Date, 'now', () => fake_now)
        spy_console_log = chai.spy.on(console, 'log', () => undefined)
    })

    afterEach(function() {
        chai.spy.restore(Date)
        chai.spy.restore(console)
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

    describe('#create_log()', function() {

        it('should create log message by assemble prop of request object', function() {
            const mock_request = { ip: '127.0.0.1', method: 'GET', path: '/some/path' }
            create_log(mock_request as any, 996)
            expect(spy_console_log).to.have.been.first.called.with(`[${time_str}]127.0.0.1             996ms GET     success  `, '/some/path')
        })

        it('should set method as "-" if method is undefined', function() {
            const mock_request = { ip: '127.0.0.1', path: '/some/path' }
            create_log(mock_request as any, 996)
            expect(spy_console_log).to.have.been.first.called.with(`[${time_str}]127.0.0.1             996ms -       success  `, '/some/path')
        })

        it('should log detail of BusinessError', function() {
            const mock_request = { ip: '39.62.45.2', method: 'GET', path: '/some/path' }
            const err = new BusinessError('ERR.NOT_FOUND', 'resource not exists')
            create_log(mock_request as any, 996, err)
            expect(spy_console_log).to.have.been.first.called.with(`[${time_str}]39.62.45.2            996ms GET     business `, '/some/path', '<ERR.NOT_FOUND resource not exists>')
        })

        it('should log detail of CrashError', function() {
            const mock_request = { ip: '39.88.125.6', method: 'POST', path: '/some/path' }
            const err = new CrashError('ERR.CRASH', 'server crashed')
            create_log(mock_request as any, 996, err)
            expect(spy_console_log).to.have.been.first.called.with(`[${time_str}]39.88.125.6           996ms POST    crash    `, '/some/path', '<ERR.CRASH server crashed>')
        })

        it('should log detail of StandardError', function() {
            const mock_request = { ip: '39.88.125.6', method: 'POST', path: '/some/path' }
            const err = new StandardError(401, 'Unauthorized')
            create_log(mock_request as any, 996, err)
            expect(spy_console_log).to.have.been.first.called.with(`[${time_str}]39.88.125.6           996ms POST    standard `, '/some/path', '<401 Unauthorized>')
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
                await new HttpHooks().on_finish(context, null as any)
                expect(spy_console_log).to.have.been.first.called.with(`[${time_str}]39.88.125.6           996ms POST    success  `, '/some/path')
            })
        })

        describe('.on_error()', function() {

            it('should create log', async function() {
                const { context } = mock()
                context.set('process_start', fake_now - 996)
                const err = new BusinessError('ERR.NOT_FOUND', 'resource not exists')
                await new HttpHooks().on_error(context, err)
                expect(spy_console_log).to.have.been.first.called.with(`[${time_str}]39.88.125.6           996ms POST    business `, '/some/path', '<ERR.NOT_FOUND resource not exists>')
            })
        })
    })
})
