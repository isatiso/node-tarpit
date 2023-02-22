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

type SendMessageOptions = { mask?: boolean | undefined; binary?: boolean | undefined; compress?: boolean | undefined; fin?: boolean | undefined }

export class TpWebSocket {

    private _on_message?: (data: Buffer | ArrayBuffer | Buffer[], is_binary: boolean) => void
    private _on_close?: (code: number, reason: Buffer) => void
    private _on_error?: (err: Error) => void
    private _on_message_error?: (err: Error) => void

    constructor(
        public readonly socket: WebSocket,
    ) {

        this.socket.on('close', (code, reason) => this._on_close?.(code, reason))
        this.socket.on('error', err => this._on_error?.(err))
    }

    on_message(listener: (data: Buffer | ArrayBuffer | Buffer[], is_binary: boolean) => void): void {
        if (!this._on_message) {
            this._on_message = listener
            this.socket.on('message', (data, isBinary) => {
                try {
                    this._on_message?.(data, isBinary)
                } catch (e) {
                    this.socket.emit('error', e)
                }
            })
        } else {
            this._on_message = listener
        }
    }

    on_close(listener: (code: number, reason: Buffer) => void): void {
        this._on_close = listener
        this.socket.on('close', (code, reason) => this._on_close?.(code, reason))
    }

    on_error(listener: (err: Error) => void): void {
        this._on_error = listener
    }

    on_message_error(listener: (err: Error) => void): void {
        this._on_message_error = listener
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
