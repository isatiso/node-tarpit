/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ConfigData } from '@tarpit/config'
import { Injector, TpPlugin, TpPluginConstructor, TpPluginType, ValueProvider } from '@tarpit/core'
import { Server } from 'http'
import Koa from 'koa'
import { Socket } from 'net'
import { TLSSocket } from 'tls'
import { Authenticator } from './__services__/authenticator'
import { CacheProxy } from './__services__/cache-proxy'
import { LifeCycle } from './__services__/life-cycle'
import { ResultWrapper } from './__services__/result-wrapper'

import { ApiMethod, ApiPath, HandlerReturnType, HttpHandlerDescriptor, KoaResponseType, LiteContext, TpRouterMeta } from './__types__'
import { BodyParser } from './body-parser'
import { Handler } from './handler'

declare module 'koa' {
    interface Request {
        body?: any
        rawBody: string
    }
}

export interface TpServer extends TpPluginConstructor<'TpRouter'> {
}

/**
 * @private
 * Koa adaptor.
 */
@TpPluginType({ type: 'TpRouter', loader_list: ['∑∫πœ-TpRouter'], option_key: 'routers' })
export class TpHttpServer implements TpPlugin<'TpRouter'> {

    private _koa = new Koa()
    private _server?: Server
    private _http_handler = new Handler()
    private _body_parser = new BodyParser()
    private _terminating: Promise<void> | undefined
    private _sockets = new Set<Socket | TLSSocket>()

    constructor(private injector: Injector, private config_data: ConfigData) {

        this._koa.use(this.cors)
        this._koa.use(this.body_parser)
        this._koa.use(async (ctx: LiteContext, next) => this._http_handler.handle(ctx, next))

        this.injector.set_provider(Authenticator, new ValueProvider('Authenticator', null))
        this.injector.set_provider(CacheProxy, new ValueProvider('CacheProxy', null))
        this.injector.set_provider(LifeCycle, new ValueProvider('LifeCycle', null))
        this.injector.set_provider(ResultWrapper, new ValueProvider('ResultWrapper', null))
    }

    load(meta: TpRouterMeta, injector: Injector): void {
        meta.function_collector()
            .filter((f) => f.type === 'TpRouterFunction')
            .forEach(f => this._http_handler.load(f, injector, meta))
    }

    on<T, R extends KoaResponseType>(method: ApiMethod, path: ApiPath, handler: (params: T, ctx: LiteContext) => HandlerReturnType<R>): void {
        this._http_handler.on(method, path, handler)
    }

    get_api_list(): Omit<HttpHandlerDescriptor, 'handler'>[]
    get_api_list(need_handler: true): HttpHandlerDescriptor[]
    get_api_list(need_handler?: boolean): HttpHandlerDescriptor[] | Omit<HttpHandlerDescriptor, 'handler'>[] {
        return this._http_handler.list(need_handler)
    }

    use(middleware: (ctx: LiteContext, next: () => Promise<any>) => void) {
        this._koa.use(middleware)
    }

    /**
     * Koa listen
     */
    async start(): Promise<void> {
        const port = this.config_data.get('http.port')
        const keepalive_timeout = this.config_data.get('http.keepalive_timeout')
        return new Promise(resolve => {
            this._server = this._koa.on('error', (err, ctx: LiteContext) => {
                if (err.code !== 'HPE_INVALID_EOF_STATE') {
                    console.log('server error', err, ctx)
                    console.log(ctx.request.rawBody)
                }
            }).listen(port, () => resolve())
            if (keepalive_timeout) {
                this._server.keepAliveTimeout = keepalive_timeout
            }
            this._server.on('connection', socket => this.record_socket(socket))
        })
    }

    async destroy(): Promise<void> {
        if (!this._server) {
            return
        }
        return this.terminate()
    }

    private terminate() {
        if (this._terminating) {
            return this._terminating
        }

        this._terminating = new Promise((resolve, reject) => {
            this._server?.on('request', (req, res) => {
                if (!res.headersSent) {
                    res.setHeader('connection', 'close')
                }
            })
            this._server?.close((error) => error ? reject(error) : resolve())

            for (const socket of this._sockets) {
                // @ts-expect-error Unclear if I am using wrong type or how else this should be handled.
                const serverResponse = socket._httpMessage
                if (serverResponse) {
                    if (!serverResponse.headersSent) {
                        serverResponse.setHeader('connection', 'close')
                    }
                    continue
                }
                this.destroy_socket(socket)
            }
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

    private body_parser: Koa.Middleware<any> = async (ctx: Koa.Context, next: Koa.Next) => {
        if (ctx.request.body !== undefined || ctx.disableBodyParser) {
            return await next()
        }
        try {
            const res = await this._body_parser.parseBody(ctx)
            ctx.request.body = 'parsed' in res ? res.parsed : {}
            if (ctx.request.rawBody === undefined) {
                ctx.request.rawBody = res.raw
            }
        } catch (err) {
            ctx.response.status = 400
            ctx.response.body = 'Bad Request'
            console.log('parse body error', ctx.request.path)
        }
        return await next()
    }

    private cors: Koa.Middleware<any> = async (ctx: Koa.Context, next: Koa.Next) => {
        const allow_origin = this.config_data.get('http.cors.allow_origin') ?? ''
        const allow_headers = this.config_data.get('http.cors.allow_headers') ?? ''
        const allow_methods = this.config_data.get('http.cors.allow_methods') ?? ''
        allow_origin && ctx.response.res.setHeader('Access-Control-Allow-Origin', allow_origin)
        if (ctx.method === 'OPTIONS') {
            allow_headers && ctx.response.res.setHeader('Access-Control-Allow-Headers', allow_headers)
            allow_methods && ctx.response.res.setHeader('Access-Control-Allow-Methods', allow_methods)
            ctx.response.body = ''
        }
        return await next()
    }
}

