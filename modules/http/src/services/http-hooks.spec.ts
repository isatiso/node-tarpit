/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Dora } from '@tarpit/dora'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpContext, TpRequest } from '../builtin'
import { TpHttpFinish } from '../errors'
import { assemble_duration, create_request_log, HttpHooks } from './http-hooks'

describe('http-hooks.ts', function() {

    function mock() {
        const mock_response = { set: () => undefined } as any
        const spy_response_set = vi.spyOn(mock_response, 'set')
        const mock_request = { ip: '39.88.125.6', method: 'POST', path: '/some/path' } as any
        const context = new HttpContext(mock_request, mock_response)
        const spy_get = vi.spyOn(context, 'get')
        const spy_set = vi.spyOn(context, 'set')
        return { context, mock_request, mock_response, spy_response_set, spy_get, spy_set }
    }

    function redo_spy_console() {
        console_spies.forEach(spy => spy.mockRestore())
        console_spies = ['debug', 'log', 'info', 'warn', 'error'].map(level => vi.spyOn(console, level as any).mockImplementation(() => undefined))
    }

    const fake_now = 1657960791441
    const time_str = new Dora(fake_now).format('YYYY-MM-DDTHH:mm:ssZZ')
    let console_spies: any[] = []

    beforeAll(function() {
        vi.spyOn(Date, 'now').mockImplementation(() => fake_now)
        console_spies = ['debug', 'log', 'info', 'warn', 'error'].map(level => vi.spyOn(console, level as any).mockImplementation(() => undefined))
    })

    afterAll(function() {
        vi.restoreAllMocks()
    })

    beforeEach(function() {
        redo_spy_console()
    })

    describe('#assemble_duration()', function() {

        it('should get start time from context and figure out duration and set to response header X-Duration', function() {
            const { context, spy_get, spy_response_set } = mock()
            context.set('process_start', fake_now - 1000)
            assemble_duration(context)
            expect(spy_get).toHaveBeenCalledWith('process_start')
            expect(spy_response_set).toHaveBeenCalledWith('X-Duration', 1000)
        })

        it('should set -1 to response header X-Duration if process_start not exists', function() {
            const { context, spy_get, spy_response_set } = mock()
            assemble_duration(context)
            expect(spy_get).toHaveBeenCalledWith('process_start')
            expect(spy_response_set).toHaveBeenCalledWith('X-Duration', -1)
        })
    })

    describe('#create_request_log()', function() {

        it('should create log message by assemble prop of request object', function() {
            const { context } = mock()
            context.set('process_start', fake_now - 996)
            context.response.status = 200
            create_request_log(context, 996)
            expect(console.info).toHaveBeenCalledWith(`[${time_str}]39.88.125.6           996ms POST    200 `, '/some/path', '')
        })

        it('should set method as "-" if method is undefined', function() {
            const { context, mock_request } = mock()
            context.set('process_start', fake_now - 996)
            context.response.status = 200
            mock_request.method = undefined
            mock_request.ip = '127.0.0.1'
            create_request_log(context, 996)
            expect(console.info).toHaveBeenCalledWith(`[${time_str}]127.0.0.1             996ms -       200 `, '/some/path', '')
        })

        it('should log detail of CrashError', function() {
            const { context } = mock()
            context.set('process_start', fake_now - 996)
            context.result = new TpHttpFinish({ status: 500, code: '500', msg: 'Internal Server Error' })
            context.response.status = 500
            create_request_log(context, 996)
            expect(console.info).toHaveBeenCalledWith(`[${time_str}]39.88.125.6           996ms POST    500 `, '/some/path', '<500 Internal Server Error>')
        })

        it('should log detail of StandardError', function() {
            const { context } = mock()
            context.set('process_start', fake_now - 996)
            context.result = new TpHttpFinish({ status: 401, code: '401', msg: 'Unauthorized' })
            context.response.status = 401
            create_request_log(context, 996)
            expect(console.info).toHaveBeenCalledWith(`[${time_str}]39.88.125.6           996ms POST    401 `, '/some/path', '<401 Unauthorized>')
        })
    })

    describe('HttpHooks', function() {

        describe('.on_init()', function() {

            it('should set process_start to context', async function() {
                const { context, spy_set } = mock()
                await new HttpHooks().on_init(context)
                expect(spy_set).toHaveBeenCalledWith('process_start', fake_now)
            })
        })

        describe('.on_finish()', function() {

            it('should create log', async function() {
                const { context } = mock()
                context.set('process_start', fake_now - 996)
                context.response.status = 200
                await new HttpHooks().on_finish(context)
                expect(console.info).toHaveBeenCalledWith(`[${time_str}]39.88.125.6           996ms POST    200 `, '/some/path', '')
            })
        })

        describe('.on_error()', function() {

            it('should create log', async function() {
                const { context } = mock()
                context.set('process_start', fake_now - 996)
                context.result = new TpHttpFinish({ status: 404, code: '404', msg: 'Not Found' })
                context.response.status = 404
                await new HttpHooks().on_error(context)
                expect(console.info).toHaveBeenCalledWith(`[${time_str}]39.88.125.6           996ms POST    404 `, '/some/path', '<404 Not Found>')
            })
        })

        describe('.on_ws_init()', function() {

            it('should create log', async function() {
                await new HttpHooks().on_ws_init(null as any, { ip: '152.215.22.3', path: '/some/path' } as TpRequest)
                await new HttpHooks().on_ws_init(null as any, { ip: '45.12.2.3' } as TpRequest)
                expect(console.info).toHaveBeenCalledWith(`[${time_str}]152.215.22.3           OPEN SOCKET  -   `, '/some/path', undefined)
                expect(console.info).toHaveBeenCalledWith(`[${time_str}]45.12.2.3              OPEN SOCKET  -   `, '-', undefined)
            })
        })

        describe('.on_ws_close()', function() {

            it('should create log', async function() {
                await new HttpHooks().on_ws_close(null as any, { ip: '152.215.22.3', path: '/some/path' } as TpRequest, 1001)
                await new HttpHooks().on_ws_close(null as any, { ip: '45.12.2.3' } as TpRequest, 1098)
                expect(console.info).toHaveBeenCalledWith(`[${time_str}]152.215.22.3          CLOSE SOCKET  1001`, '/some/path', undefined)
                expect(console.info).toHaveBeenCalledWith(`[${time_str}]45.12.2.3             CLOSE SOCKET  1098`, '-', undefined)
            })
        })
    })

})
