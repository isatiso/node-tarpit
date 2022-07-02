/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData } from '@tarpit/config'
import { Injector, TpService } from '@tarpit/core'
import http, { IncomingMessage, Server, ServerResponse } from 'http'
import { Socket } from 'net'
import { TLSSocket } from 'tls'

@TpService({ inject_root: true })
export class HttpServer {

    private _server?: Server
    private _terminating: Promise<void> | undefined
    private _sockets = new Set<Socket | TLSSocket>()

    private readonly port = this.config_data.get('http.port')
    private readonly keepalive_timeout = this.config_data.get('http.keepalive_timeout')

    constructor(
        private injector: Injector,
        private config_data: ConfigData
    ) {
    }

    async start(request_listener: (req: IncomingMessage, res: ServerResponse) => Promise<void>): Promise<void> {
        return new Promise(resolve => {
            this._server = http.createServer((req, res) => {
                if (this._terminating) {
                    res.setHeader('Connection', 'close')
                }
                request_listener(req, res)
            }).listen(this.port, () => resolve())
            if (this.keepalive_timeout) {
                this._server.keepAliveTimeout = this.keepalive_timeout
            }
            this._server.on('connection', socket => this.record_socket(socket))
        })
    }

    async terminate() {
        if (!this._server) {
            return
        }
        return this._terminating = this._terminating ?? new Promise((resolve, reject) => {
            this._server?.close(error => error ? reject(error) : resolve())
            let start = Date.now()
            const interval = setInterval(() => {
                if (this._sockets.size === 0 || Date.now() - start > 4000) {
                    clearInterval(interval)
                    for (const socket of this._sockets) {
                        this.destroy_socket(socket)
                    }
                }
            }, 20)
        })
    }

    private destroy_socket(socket: Socket | TLSSocket) {
        socket.destroy()
        this._sockets.delete(socket)
    }

    private record_socket(socket: Socket | TLSSocket) {
        if (this._terminating) {
            socket.destroy()
        } else {
            this._sockets.add(socket)
            socket.once('close', () => this._sockets.delete(socket))
        }
    }
}
