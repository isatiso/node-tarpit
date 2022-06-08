/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData } from '@tarpit/config'
import { ClassProvider, Injector, TpPlugin, TpPluginType } from '@tarpit/core'
import http, { IncomingMessage, Server, ServerResponse } from 'http'
import { Socket } from 'net'
import { TLSSocket } from 'tls'
import { ApiMethod, ApiPath, HttpHandler, HttpHandlerDescriptor } from './__types__'
import { TpRouter, TpRouterToken } from './annotations'

import {
    AbstractAuthenticator,
    AbstractCacheProxy,
    AbstractErrorFormatter,
    AbstractHttpDecompressor,
    AbstractLifeCycle,
    AbstractResponseFormatter,
    BodyReader,
    Handler,
    TpAuthenticator,
    TpCacheProxy,
    TpErrorFormatter,
    TpHttpDecompressor,
    TpLifeCycle,
    TpResponseFormatter,
    URLParser
} from './services'
import { collect_routes } from './tools/collect-routes'

@TpPlugin({ targets: [TpRouterToken] })
export class TpHttpServer implements TpPluginType {

    private _server?: Server
    private _http_handler: Handler
    private _terminating: Promise<void> | undefined
    private _sockets = new Set<Socket | TLSSocket>()
    private readonly allow_origin = this.config_data.get('http.cors.allow_origin') ?? ''
    private readonly allow_headers = this.config_data.get('http.cors.allow_headers') ?? ''
    private readonly allow_methods = this.config_data.get('http.cors.allow_methods') ?? ''
    private readonly max_age = this.config_data.get('http.cors.max_age') ?? 0

    constructor(private injector: Injector, private config_data: ConfigData) {
        ClassProvider.create(this.injector, AbstractHttpDecompressor, TpHttpDecompressor).set_used()
        ClassProvider.create(this.injector, AbstractCacheProxy, TpCacheProxy).set_used()
        ClassProvider.create(this.injector, AbstractLifeCycle, TpLifeCycle).set_used()
        ClassProvider.create(this.injector, AbstractAuthenticator, TpAuthenticator).set_used()
        ClassProvider.create(this.injector, AbstractResponseFormatter, TpResponseFormatter).set_used()
        ClassProvider.create(this.injector, AbstractErrorFormatter, TpErrorFormatter).set_used()
        ClassProvider.create(this.injector, BodyReader, BodyReader).set_used()
        ClassProvider.create(this.injector, URLParser, URLParser).set_used()
        this._http_handler = ClassProvider.create(this.injector, Handler, Handler).set_used().create()
    }

    async handle_request(req: IncomingMessage, res: ServerResponse) {
        res.statusCode = 404
        this.allow_origin && res.setHeader('Access-Control-Allow-Origin', this.allow_origin)
        if (req.method === 'OPTIONS') {
            this.allow_headers && res.setHeader('Access-Control-Allow-Headers', this.allow_headers)
            this.allow_methods && res.setHeader('Access-Control-Allow-Methods', this.allow_methods)
            this.max_age && res.setHeader('Access-Control-Max-Age', this.max_age)
            res.statusCode = 204
            res.end('')
            return
        }
        if (this._terminating) {
            res.setHeader('Connection', 'close')
        }
        return this._http_handler.handle(req, res)
    }

    load(meta: TpRouter, injector: Injector): void {
        collect_routes(meta).forEach(f => this._http_handler.load(f, injector, meta))
    }

    bind(method: ApiMethod, path: ApiPath, handler: HttpHandler): void {
        this._http_handler.bind(method, path, handler)
    }

    async start(): Promise<void> {
        const port = this.config_data.get('http.port')
        const keepalive_timeout = this.config_data.get('http.keepalive_timeout')
        return new Promise(resolve => {
            this._server = http.createServer((req, res) => this.handle_request(req, res))
                .listen(port, () => resolve())
            if (keepalive_timeout) {
                this._server.keepAliveTimeout = keepalive_timeout
            }
            this._server.on('connection', socket => this.record_socket(socket))
        })
    }

    get_api_list(): Omit<HttpHandlerDescriptor, 'handler'>[]
    get_api_list(need_handler: false): Omit<HttpHandlerDescriptor, 'handler'>[]
    get_api_list(need_handler: true): HttpHandlerDescriptor[]
    get_api_list(need_handler?: boolean): HttpHandlerDescriptor[] | Omit<HttpHandlerDescriptor, 'handler'>[] {
        return this._http_handler.list(need_handler)
    }

    async terminate() {
        if (!this._server) {
            return
        }
        if (this._terminating) {
            return this._terminating
        }

        this._terminating = new Promise((resolve, reject) => {
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

        return this._terminating
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
