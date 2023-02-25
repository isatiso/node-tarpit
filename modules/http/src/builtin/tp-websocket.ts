/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

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

type EventNeedToWrap = 'message' | 'error' | 'close'
type SendMessageOptions = { mask?: boolean | undefined; binary?: boolean | undefined; compress?: boolean | undefined; fin?: boolean | undefined }
type ListenerErrorHandler = (event: EventNeedToWrap, ws: TpWebSocket, err: unknown) => void

export class TpWebSocket {

    static event_need_to_wrap: EventNeedToWrap[] = ['message', 'close', 'error']
    private _listener_error_handler?: ListenerErrorHandler

    constructor(
        private _socket: WebSocket,
    ) {
    }

    on(event: 'close', listener: (code: number, reason: Buffer) => void): this
    on(event: 'error', listener: (err: Error) => void): this
    on(event: 'message', listener: (data: Buffer, isBinary: boolean) => void): this
    on(event: string | symbol, listener: (...args: any[]) => void): this {
        return this.set_listener(event, false, listener)
    }

    once(event: 'close', listener: (code: number, reason: Buffer) => void): this
    once(event: 'error', listener: (err: Error) => void): this
    once(event: 'message', listener: (data: Buffer, isBinary: boolean) => void): this
    once(event: string | symbol, listener: (...args: any[]) => void): this {
        return this.set_listener(event, true, listener)
    }

    off(event: EventNeedToWrap): this {
        this._socket.removeAllListeners(event)
        return this
    }

    close(code?: number, data?: string | Buffer): void {
        this._socket.close(code, data)
    }

    terminate() {
        return this._socket.terminate()
    }

    async send(data: BufferLike): Promise<Error | undefined>
    async send(data: BufferLike, options?: SendMessageOptions): Promise<Error | undefined>
    async send(data: BufferLike, options?: SendMessageOptions): Promise<Error | undefined> {
        return new Promise((resolve, reject) => {
            if (this._socket.readyState === WebSocket.OPEN) {
                this._socket.send(data, options ?? {}, err => err ? reject(err) : resolve(undefined))
            } else {
                resolve(undefined)
            }
        })
    }

    on_listener_error(handler: ListenerErrorHandler) {
        this._listener_error_handler = handler
    }

    private set_listener(event: string | symbol, once: boolean, listener: (...args: any[]) => void): this {
        const regular_listener = typeof event === 'string' && TpWebSocket.event_need_to_wrap.includes(event as EventNeedToWrap) ? (...args: any[]) => {
            try {
                listener(...args)
            } catch (err) {
                if (this._listener_error_handler) {
                    this._listener_error_handler(event as EventNeedToWrap, this, err)
                } else {
                    console.log(`Uncaught Error from TpWebSocket event ${event}: ${err}`)
                }
            }
        } : listener
        if (once) {
            this._socket.once(event, regular_listener)
        } else {
            this._socket.on(event, regular_listener)
        }
        return this
    }
}
