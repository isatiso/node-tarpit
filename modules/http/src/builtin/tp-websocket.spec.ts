/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { WebSocket } from 'ws'
import { TpWebSocket } from './tp-websocket'

class MockWebSocket {
    spy_on: (...args: any[]) => void
    spy_off: (...args: any[]) => void
    spy_once: (...args: any[]) => void
    spy_removeAllListeners: (...args: any[]) => void
    on: (event: string, listener: (...args: any[]) => void) => void
    off: (event: string, listener: (...args: any[]) => void) => void
    once: (event: string, listener: (...args: any[]) => void) => void
    send!: (data: any, options?: Record<string, string>, cb?: (err: Error | undefined) => void) => void
    close: (...args: any[]) => void
    terminate: (...args: any[]) => void
    removeAllListeners: (...args: any[]) => void
    listen_history: { [event: string]: any[][] } = {}
    send_history: any[][] = []
    readyState: number = WebSocket.OPEN

    constructor() {
        this.spy_on = vi.fn()
        this.spy_off = vi.fn()
        this.spy_once = vi.fn()
        this.spy_removeAllListeners = vi.fn()
        this.on = MockWebSocket.record_history(this.listen_history, this.spy_on)
        this.off = MockWebSocket.record_history(this.listen_history, this.spy_off)
        this.once = MockWebSocket.record_history(this.listen_history, this.spy_once)
        this.removeAllListeners = MockWebSocket.record_history(this.listen_history, this.spy_removeAllListeners)
        this.send_normal()
        this.close = vi.fn()
        this.terminate = vi.fn()
    }

    static record_history(history: { [event: string]: any[][] }, spy: any) {
        return (event: string, listener: (...args: any[]) => void) => {
            if (!history[event]) {
                history[event] = []
            }
            history[event].push([event, listener])
            spy(event, listener)
        }
    }

    send_normal() {
        this.send = (data: any, options?: Record<string, string>, cb?: (err: Error | undefined) => void) => {
            this.send_history.push([data, options])
            cb?.(undefined)
        }
    }

    send_with_err_cb(msg: string) {
        this.send = (data: any, options?: Record<string, string>, cb?: (err: Error | undefined) => void) => {
            this.send_history.push([data, options])
            cb?.(new Error(msg))
        }
    }
}

describe('tp-websocket.ts', function() {

    let console_spies: any[] = []

    function redo_spy_console() {
        console_spies.forEach(spy => spy.mockRestore())
        console_spies = ['debug', 'log', 'info', 'warn', 'error'].map(level => vi.spyOn(console, level as any).mockImplementation(() => undefined))
    }

    beforeAll(function() {
        console_spies = ['debug', 'log', 'info', 'warn', 'error'].map(level => vi.spyOn(console, level as any).mockImplementation(() => undefined))
    })

    afterAll(function() {
        console_spies.forEach(spy => spy.mockRestore())
    })

    describe('.on()', function() {

        it('should wrap listener of event "message"', function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            const listener = vi.fn()
            ws.on('message', listener)
            expect(mock.spy_on).toHaveBeenCalledOnce()
            expect(mock.listen_history['message']).toHaveLength(1)
            expect(mock.listen_history['message'][0][1]).not.to.equal(listener)
            expect(listener).not.toHaveBeenCalled()
            const params: [Buffer, boolean] = [Buffer.from('message some random content'), false]
            mock.listen_history['message'][0][1](...params)
            expect(listener).toHaveBeenCalledWith(...params)
        })

        it('should wrap listener of event "close"', function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            const listener = vi.fn()
            ws.on('close', listener)
            expect(mock.spy_on).toHaveBeenCalledOnce()
            expect(mock.listen_history['close']).toHaveLength(1)
            expect(mock.listen_history['close'][0][1]).not.to.equal(listener)
            expect(listener).not.toHaveBeenCalled()
            const params: [number, string] = [1231, 'some reason message']
            mock.listen_history['close'][0][1](...params)
            expect(listener).toHaveBeenCalledWith(...params)
        })

        it('should wrap listener of event "error"', function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            const listener = vi.fn()
            ws.on('error', listener)
            expect(mock.spy_on).toHaveBeenCalledOnce()
            expect(mock.listen_history['error']).toHaveLength(1)
            expect(mock.listen_history['error'][0][1]).not.to.equal(listener)
            expect(listener).not.toHaveBeenCalled()
            const params: [Error] = [new Error('here should be some error message')]
            mock.listen_history['error'][0][1](...params)
            expect(listener).toHaveBeenCalledWith(...params)
        })

        it('should deliver call to inner socket directly if event type do not need to wrap', function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            const listener = vi.fn()
            ws.on('whatever' as any, listener)
            expect(mock.spy_on).toHaveBeenCalledWith('whatever', listener)
        })

        it('should call _listener_error_handler if listener throw an error', function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            const _listener_error_handler = vi.fn()
            ws.on_listener_error(_listener_error_handler)
            const error = new Error('business error')
            const listener = () => {
                throw error
            }
            ws.on('error', listener)
            mock.listen_history['error'][0][1]()
            expect(_listener_error_handler).toHaveBeenCalledWith('error', ws, error)
        })

        it('should log message if _listener_error_handler is not set', function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            redo_spy_console()
            const listener = () => {
                throw new Error('business error')
            }
            ws.on('error', listener)
            mock.listen_history['error'][0][1]()
            expect(console.error).toHaveBeenCalledOnce()
        })
    })

    describe('.once()', function() {

        it('should wrap listener of event "message"', function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            const listener = vi.fn()
            ws.once('message', listener)
            expect(mock.spy_once).toHaveBeenCalledOnce()
            expect(mock.listen_history['message']).toHaveLength(1)
            expect(mock.listen_history['message'][0][1]).not.to.equal(listener)
            expect(listener).not.toHaveBeenCalled()
            const params: [Buffer, boolean] = [Buffer.from('message some random content'), false]
            mock.listen_history['message'][0][1](...params)
            expect(listener).toHaveBeenCalledWith(...params)
        })

        it('should wrap listener of event "close"', function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            const listener = vi.fn()
            ws.once('close', listener)
            expect(mock.spy_once).toHaveBeenCalledOnce()
            expect(mock.listen_history['close']).toHaveLength(1)
            expect(mock.listen_history['close'][0][1]).not.to.equal(listener)
            expect(listener).not.toHaveBeenCalled()
            const params: [number, string] = [1231, 'some reason message']
            mock.listen_history['close'][0][1](...params)
            expect(listener).toHaveBeenCalledWith(...params)
        })

        it('should wrap listener of event "error"', function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            const listener = vi.fn()
            ws.once('error', listener)
            expect(mock.spy_once).toHaveBeenCalledOnce()
            expect(mock.listen_history['error']).toHaveLength(1)
            expect(mock.listen_history['error'][0][1]).not.to.equal(listener)
            expect(listener).not.toHaveBeenCalled()
            const params: [Error] = [new Error('here should be some error message')]
            mock.listen_history['error'][0][1](...params)
            expect(listener).toHaveBeenCalledWith(...params)
        })

        it('should deliver call to inner socket directly if event type do not need to wrap', function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            const listener = vi.fn()
            ws.once('whatever' as any, listener)
            expect(mock.spy_once).toHaveBeenCalledWith('whatever', listener)
        })
    })

    describe('.send()', function() {

        it('should deliver call to inner socket', async function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            await ws.send('message')
            expect(mock.send_history).toHaveLength(1)
            expect(mock.send_history[0][0]).toEqual('message')
            const options = { fin: true }
            await ws.send('another message', options)
            expect(mock.send_history).toHaveLength(2)
            expect(mock.send_history[1][0]).toEqual('another message')
            expect(mock.send_history[1][1]).toEqual(options)
        })

        it('should throw error if inner send callback with error', async function() {
            const mock = new MockWebSocket()
            mock.send_with_err_cb('something error')
            const ws = new TpWebSocket(mock as any)
            const message = 'hahaha bla bla bla'
            await expect(ws.send(message)).rejects.toThrow('something error')
            expect(mock.send_history).toHaveLength(1)
            expect(mock.send_history[0][0]).toEqual(message)
        })

        it('should resolve promise with undefined if inner socket is not OPEN', async function() {
            const mock = new MockWebSocket()
            mock.readyState = WebSocket.CLOSING
            const ws = new TpWebSocket(mock as any)
            const message = 'hahaha bla bla bla'
            await ws.send(message)
            expect(mock.send_history).toHaveLength(0)
        })
    })

    describe('.close()', function() {

        it('should call close of inner socket', function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            ws.close(1332, 'close reason detail')
            expect(mock.close).toHaveBeenCalledWith(1332, 'close reason detail')
        })
    })

    describe('.terminate()', function() {

        it('should call close of inner socket', function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            ws.terminate()
            expect(mock.terminate).toHaveBeenCalledOnce()
        })
    })

    describe('.off()', function() {

        it('should call off of inner socket', function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            const listener = () => undefined
            ws.on('message', listener)
            ws.off('message', listener)
            expect(mock.spy_off).toHaveBeenCalledWith('message', listener)
            ws.on('close', listener)
            ws.off('close', listener)
            expect(mock.spy_off).toHaveBeenCalledWith('close', listener)
            ws.on('error', listener)
            ws.off('error', listener)
            expect(mock.spy_off).toHaveBeenCalledWith('error', listener)
        })
    })

    describe('.removeAllListener()', function() {

        it('should call removeAllListeners of inner socket', function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            ws.removeAllListeners('message')
            expect(mock.spy_removeAllListeners).toHaveBeenCalledWith('message', undefined)
        })
    })
})
