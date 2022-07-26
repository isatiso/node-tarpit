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

    public sockets = new Set<Socket | TLSSocket>()
    public readonly port = this.config_data.get('http.port')
    public readonly keepalive_timeout = this.config_data.get('http.server.keepalive_timeout')
    public readonly terminate_timeout = this.config_data.get('http.server.terminate_timeout') ?? 4000

    public starting: Promise<void> | undefined = undefined
    public terminating: Promise<void> | undefined = undefined

    constructor(
        private injector: Injector,
        private config_data: ConfigData
    ) {
    }

    private _server?: Server
    get server(): Server | undefined {
        return this._server
    }

    start(request_listener: (req: IncomingMessage, res: ServerResponse) => Promise<void>): Promise<void> {
        return this.starting = this.starting ?? new Promise(resolve => {
            this._server = http.createServer((req, res) => {
                // istanbul ignore if
                if (this.terminating) {
                    res.setHeader('Connection', 'close')
                }
                request_listener(req, res).then()
            }).listen(this.port, () => resolve())
            if (this.keepalive_timeout) {
                this._server.keepAliveTimeout = this.keepalive_timeout
            }
            this._server.on('connection', socket => {
                this.sockets.add(socket)
                socket.once('close', () => this.sockets.delete(socket))
            })
        })
    }

    terminate(): Promise<void> {
        if (!this.starting) {
            return new Promise(resolve => resolve())
        }
        return this.terminating = this.terminating ?? new Promise(resolve => {
            this._server!.on('close', resolve)
            this._server!.close()
            let start = Date.now()
            const interval = setInterval(() => {
                if (this.sockets.size === 0 || Date.now() - start > this.terminate_timeout) {
                    clearInterval(interval)
                    for (const socket of this.sockets) {
                        this.destroy_socket(socket)
                    }
                }
            }, 20)
        })
    }

    private destroy_socket(socket: Socket | TLSSocket) {
        socket.destroy()
        this.sockets.delete(socket)
    }
}
