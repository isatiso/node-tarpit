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
import { WebSocket } from 'ws'
import { TpWebSocket } from './tp-websocket'

chai.use(cap)
chai.use(chai_spies)

class MockWebSocket {
    spy_on: (...args: any[]) => void
    spy_once: (...args: any[]) => void
    on: (event: string, listener: (...args: any[]) => void) => void
    once: (event: string, listener: (...args: any[]) => void) => void
    send!: (data: any, options?: Record<string, string>, cb?: (err: Error | undefined) => void) => void
    close: (...args: any[]) => void
    terminate: (...args: any[]) => void
    removeAllListeners: (...args: any[]) => void
    listen_history: { [event: string]: any[][] } = {}
    send_history: any[][] = []
    readyState: number = WebSocket.OPEN

    constructor() {
        this.spy_on = chai.spy()
        this.spy_once = chai.spy()
        this.on = MockWebSocket.record_history(this.listen_history, this.spy_on)
        this.once = MockWebSocket.record_history(this.listen_history, this.spy_once)
        this.send_normal()
        this.close = chai.spy()
        this.terminate = chai.spy()
        this.removeAllListeners = chai.spy()
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

    static record_history(history: { [event: string]: any[][] }, spy: any) {
        return (event: string, listener: (...args: any[]) => void) => {
            if (!history[event]) {
                history[event] = []
            }
            history[event].push([event, listener])
            spy(event, listener)
        }
    }
}

describe('tp-websocket.ts', function() {

    const sandbox = chai.spy.sandbox()

    function redo_spy_console() {
        sandbox.restore()
        sandbox.on(console, ['debug', 'log', 'info', 'warn', 'error'], () => undefined)
    }

    before(function() {
        sandbox.on(console, ['debug', 'log', 'info', 'warn', 'error'], () => undefined)
    })

    after(function() {
        sandbox.restore()
    })

    describe('.on()', function() {

        it('should wrap listener of event "message"', function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            const listener = chai.spy()
            ws.on('message', listener)
            expect(mock.spy_on).to.have.been.called.once
            expect(mock.listen_history['message']).to.have.length(1)
            expect(mock.listen_history['message'][0][1]).to.not.equal(listener)
            expect(listener).to.have.not.been.called()
            const params: [Buffer, boolean] = [Buffer.from('message some random content'), false]
            mock.listen_history['message'][0][1](...params)
            expect(listener).to.have.been.called.with(...params)
        })

        it('should wrap listener of event "close"', function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            const listener = chai.spy()
            ws.on('close', listener)
            expect(mock.spy_on).to.have.been.called.once
            expect(mock.listen_history['close']).to.have.length(1)
            expect(mock.listen_history['close'][0][1]).to.not.equal(listener)
            expect(listener).to.have.not.been.called()
            const params: [number, string] = [1231, 'some reason message']
            mock.listen_history['close'][0][1](...params)
            expect(listener).to.have.been.called.with(...params)
        })

        it('should wrap listener of event "error"', function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            const listener = chai.spy()
            ws.on('error', listener)
            expect(mock.spy_on).to.have.been.called.once
            expect(mock.listen_history['error']).to.have.length(1)
            expect(mock.listen_history['error'][0][1]).to.not.equal(listener)
            expect(listener).to.have.not.been.called()
            const params: [Error] = [new Error('here should be some error message')]
            mock.listen_history['error'][0][1](...params)
            expect(listener).to.have.been.called.with(...params)
        })

        it('should deliver call to inner socket directly if event type do not need to wrap', function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            const listener = chai.spy()
            ws.on('whatever' as any, listener)
            expect(mock.spy_on).to.have.been.called.with('whatever', listener)
        })

        it('should call _listener_error_handler if listener throw an error', function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            const _listener_error_handler = chai.spy()
            ws.on_listener_error(_listener_error_handler)
            const listener = () => {
                throw new Error('business error')
            }
            ws.on('error', listener)
            mock.listen_history['error'][0][1]()
            expect(_listener_error_handler).to.have.been.called.with('error', ws)
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
            expect(console.error).to.have.been.called.once
        })
    })

    describe('.once()', function() {

        it('should wrap listener of event "message"', function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            const listener = chai.spy()
            ws.once('message', listener)
            expect(mock.spy_once).to.have.been.called.once
            expect(mock.listen_history['message']).to.have.length(1)
            expect(mock.listen_history['message'][0][1]).to.not.equal(listener)
            expect(listener).to.have.not.been.called()
            const params: [Buffer, boolean] = [Buffer.from('message some random content'), false]
            mock.listen_history['message'][0][1](...params)
            expect(listener).to.have.been.called.with(...params)
        })

        it('should wrap listener of event "close"', function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            const listener = chai.spy()
            ws.once('close', listener)
            expect(mock.spy_once).to.have.been.called.once
            expect(mock.listen_history['close']).to.have.length(1)
            expect(mock.listen_history['close'][0][1]).to.not.equal(listener)
            expect(listener).to.have.not.been.called()
            const params: [number, string] = [1231, 'some reason message']
            mock.listen_history['close'][0][1](...params)
            expect(listener).to.have.been.called.with(...params)
        })

        it('should wrap listener of event "error"', function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            const listener = chai.spy()
            ws.once('error', listener)
            expect(mock.spy_once).to.have.been.called.once
            expect(mock.listen_history['error']).to.have.length(1)
            expect(mock.listen_history['error'][0][1]).to.not.equal(listener)
            expect(listener).to.have.not.been.called()
            const params: [Error] = [new Error('here should be some error message')]
            mock.listen_history['error'][0][1](...params)
            expect(listener).to.have.been.called.with(...params)
        })

        it('should deliver call to inner socket directly if event type do not need to wrap', function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            const listener = chai.spy()
            ws.once('whatever' as any, listener)
            expect(mock.spy_once).to.have.been.called.with('whatever', listener)
        })
    })

    describe('.send()', function() {

        it('should deliver call to inner socket', async function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            await ws.send('message')
            expect(mock.send_history).to.have.length(1)
            expect(mock.send_history[0][0]).to.equal('message')
            const options = { fin: true }
            await ws.send('another message', options)
            expect(mock.send_history).to.have.length(2)
            expect(mock.send_history[1][0]).to.equal('another message')
            expect(mock.send_history[1][1]).to.equal(options)
        })

        it('should throw error if inner send callback with error', async function() {
            const mock = new MockWebSocket()
            mock.send_with_err_cb('something error')
            const ws = new TpWebSocket(mock as any)
            const message = 'hahaha bla bla bla'
            await expect(ws.send(message)).to.be.rejectedWith('something error')
            expect(mock.send_history).to.have.length(1)
            expect(mock.send_history[0][0]).to.equal(message)
        })

        it('should resolve promise with undefined if inner socket is not OPEN', async function() {
            const mock = new MockWebSocket()
            mock.readyState = WebSocket.CLOSING
            const ws = new TpWebSocket(mock as any)
            const message = 'hahaha bla bla bla'
            await ws.send(message)
            expect(mock.send_history).to.have.length(0)
        })
    })

    describe('.close()', function() {

        it('should call close of inner socket', function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            ws.close(1332, 'close reason detail')
            expect(mock.close).to.have.been.called.with(1332, 'close reason detail')
        })
    })

    describe('.terminate()', function() {

        it('should call close of inner socket', function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            ws.terminate()
            expect(mock.terminate).to.have.been.called.once
        })
    })

    describe('.off()', function() {

        it('should call removeAllListeners of inner socket', function() {
            const mock = new MockWebSocket()
            const ws = new TpWebSocket(mock as any)
            ws.off('message')
            expect(mock.removeAllListeners).to.have.been.called.with('message')
        })
    })
})
