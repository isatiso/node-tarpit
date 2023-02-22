/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ClientRequest, IncomingMessage } from 'http'
import { WebSocket } from 'ws'

type BufferLike =
    | string
    | Buffer
    | DataView
    | number
    | ArrayBufferView
    | Uint8Array
    | ArrayBuffer
    | SharedArrayBuffer
    | ReadonlyArray<any>
    | ReadonlyArray<number>
    | { valueOf(): ArrayBuffer }
    | { valueOf(): SharedArrayBuffer }
    | { valueOf(): Uint8Array }
    | { valueOf(): ReadonlyArray<number> }
    | { valueOf(): string }
    | { [Symbol.toPrimitive](hint: string): string };

type SendMessageOptions = { mask?: boolean | undefined; binary?: boolean | undefined; compress?: boolean | undefined; fin?: boolean | undefined }

export class TpWebSocket {

    private listeners: { [name: string | symbol]: (...args: any[]) => void } = {}

    constructor(
        public readonly socket: WebSocket,
    ) {
    }

    on(event: 'close', listener: (code: number, reason: Buffer) => void): this
    on(event: 'error', listener: (err: Error) => void): this
    on(event: 'upgrade', listener: (request: IncomingMessage) => void): this
    on(event: 'message', listener: (data: Buffer | ArrayBuffer | Buffer[], isBinary: boolean) => void): this
    on(event: 'open', listener: () => void): this
    on(event: 'ping' | 'pong', listener: (data: Buffer) => void): this
    on(event: 'unexpected-response', listener: (request: ClientRequest, response: IncomingMessage) => void): this
    on(event: string | symbol, listener: (...args: any[]) => void): this {
        if (!this.listeners[event]) {
            this.socket.on(event, (...args: any[]) => this.listeners[event](...args))
        }
        if (event === 'message') {
            this.listeners[event] = (data, isBinary) => {
                try {
                    listener(data, isBinary)
                } catch (e) {
                    this.socket.emit('error', e)
                }
            }
        } else {
            this.listeners[event] = listener
        }
        return this
    }

    once(event: 'close', listener: (code: number, reason: Buffer) => void): this
    once(event: 'error', listener: (err: Error) => void): this
    once(event: 'upgrade', listener: (request: IncomingMessage) => void): this
    once(event: 'message', listener: (data: Buffer | ArrayBuffer | Buffer[], isBinary: boolean) => void): this
    once(event: 'open', listener: () => void): this
    once(event: 'ping' | 'pong', listener: (data: Buffer) => void): this
    once(event: 'unexpected-response', listener: (request: ClientRequest, response: IncomingMessage) => void): this
    once(event: string | symbol, listener: (...args: any[]) => void): this {
        if (!this.listeners[event]) {
            this.socket.once(event, (...args: any[]) => this.listeners[event](...args))
        }
        if (event === 'message') {
            this.listeners[event] = (data, isBinary) => {
                try {
                    listener(data, isBinary)
                } catch (e) {
                    this.socket.emit('error', e)
                }
            }
        } else {
            this.listeners[event] = listener
        }
        return this
    }

    remove_all_listeners(event: 'close' | 'error' | 'upgrade' | 'message' | 'open' | 'ping' | 'pong' | 'unexpected-response' | string | symbol): this {
        this.socket.removeAllListeners()
        delete this.listeners[event]
        return this
    }

    close(code?: number, data?: string | Buffer): void {
        this.socket.close(code, data)
    }

    terminate() {
        return this.socket.terminate()
    }

    async send(data: BufferLike): Promise<Error | undefined>
    async send(data: BufferLike, options?: SendMessageOptions): Promise<Error | undefined>
    async send(data: BufferLike, options?: SendMessageOptions): Promise<Error | undefined> {
        return new Promise((resolve, reject) => {
            if (this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(data, options ?? {}, err => err ? reject(err) : resolve(undefined))
            }
        })
    }
}
