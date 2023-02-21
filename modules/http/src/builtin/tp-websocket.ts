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

    private _on_message?: (data: Buffer | Buffer[], is_binary: boolean) => void
    private _on_close?: (code: number, reason: Buffer) => void
    private _on_error?: (err: Error) => void

    constructor(
        public readonly socket: WebSocket
    ) {
    }

    on_message(listener: (data: Buffer | Buffer[], is_binary: boolean) => void): void {
        this._on_message = listener
    }

    on_close(listener: (code: number, reason: Buffer) => void): void {
        this._on_close = listener
    }

    on_error(listener: (err: Error) => void): void {
        this._on_error = listener
    }

    close(code?: number, data?: string | Buffer): void {
        this.socket.close(code, data)
    }

    async send(data: BufferLike): Promise<Error | undefined>
    async send(data: BufferLike, options?: SendMessageOptions): Promise<Error | undefined>
    async send(data: BufferLike, options?: SendMessageOptions): Promise<Error | undefined> {
        return new Promise((resolve, reject) => {
            this.socket.send(data, options ?? {}, err => err ? reject(err) : resolve(undefined))
        })
    }
}
