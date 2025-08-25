/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ContentReaderService, MIMEContent, text_deserialize } from '@tarpit/content-type'
import { get_providers, Injector, TpConfigData, TpService } from '@tarpit/core'
import { IncomingMessage, ServerResponse } from 'http'
import { Duplex, Readable, Transform, TransformCallback } from 'stream'
import { WebSocket } from 'ws'
import { ApiMethod, RequestHandlerWithPathArgs, SocketHandler, TpHttpResponseType, UpgradeHandlerWithPathArgs } from '../__types__'
import { TpRouter } from '../annotations'
import { FormBody, Guard, HttpContext, JsonBody, MimeBody, Params, PathArgs, RawBody, RequestHeaders, ResponseCache, TextBody, TpRequest, TpResponse, TpWebSocket } from '../builtin'
import { Finish, TpHttpFinish } from '../errors'
import { RequestUnit, RouteUnit, SocketUnit } from '../tools/collect-routes'
import { flush_response } from '../tools/flush-response'
import { HandlerBook } from '../tools/handler-book'
import { CODES_KEY, HTTP_STATUS } from '../tools/http-status'
import { HttpAuthenticator } from './http-authenticator'
import { HttpBodyFormatter } from './http-body-formatter'
import { HttpCacheProxy } from './http-cache-proxy'
import { HttpHooks } from './http-hooks'
import { HttpUrlParser } from './http-url-parser'

const BODY_TOKEN: any[] = [MimeBody, JsonBody, FormBody, TextBody, RawBody]
const REQUEST_TOKEN: any[] = [RequestHeaders, Guard, Params, PathArgs, IncomingMessage, TpRequest]
const RESPONSE_TOKEN: any[] = [ServerResponse, TpResponse]
const ALL_HANDLER_TOKEN: any[] = [HttpContext, ResponseCache].concat(BODY_TOKEN, REQUEST_TOKEN, RESPONSE_TOKEN)
const ALL_HANDLER_TOKEN_SET = new Set(ALL_HANDLER_TOKEN)

const SOCKET_TOKEN_SET = new Set([TpWebSocket, TpRequest, Params, PathArgs, Guard, RequestHeaders, IncomingMessage])

export function reply(res: ServerResponse, status: CODES_KEY) {
    res.statusCode = status
    res.statusMessage = HTTP_STATUS.message_of(status)
    if (!HTTP_STATUS.is_empty(status) && res.statusMessage) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.setHeader('Content-Length', Buffer.byteLength(res.statusMessage))
        res.end(res.statusMessage)
    } else {
        res.end()
    }
}

function wrap_error(err: any) {
    return new TpHttpFinish({ status: 500, code: 'ERR.UNCAUGHT_ERROR', msg: 'Internal Server Error', origin: err })
}

function wrap_finish(res: TpHttpResponseType) {
    return new TpHttpFinish({ status: 200, code: 'OK', msg: 'OK', body: res })
}

@TpService({ inject_root: true })
export class HttpRouters {

    public readonly handler_book = new HandlerBook()

    private readonly c_allow_headers = this.config_data.get('http.cors.allow_headers') ?? ''
    private readonly c_allow_methods = this.config_data.get('http.cors.allow_methods') ?? ''
    private readonly c_allow_origin = this.config_data.get('http.cors.allow_origin') ?? ''
    private readonly c_body_max_length = this.config_data.get('http.body.max_length') ?? 0
    private readonly c_cors_max_age = this.config_data.get('http.cors.max_age') ?? 0
    private readonly c_proxy = this.config_data.get('http.proxy')

    constructor(
        private config_data: TpConfigData,
        private url_parser: HttpUrlParser,
        private reader: ContentReaderService,
    ) {
    }

    public readonly upgrade_listener = async (req: IncomingMessage, socket: Duplex, head: Buffer): Promise<SocketHandler | undefined> => {
        const parsed_url = this.url_parser.parse({ url: req.url, headers: req.headers })
        if (!parsed_url || !req.method) {
            return
        }
        parsed_url.pathname = parsed_url.pathname!.trim().replace(/\/+$/, '') || '/'
        const handler = this.handler_book.find('SOCKET', parsed_url.pathname)
        if (!handler) {
            socket.destroy()
            return
        }
        return handler(req, socket, head, parsed_url)
    }

    public readonly request_listener = async (req: IncomingMessage, res: ServerResponse) => {
        const parsed_url = this.url_parser.parse({ url: req.url, headers: req.headers })
        if (!parsed_url || !req.method) {
            return reply(res, 400)
        }
        const pathname = parsed_url.pathname!.replace(/\/\s*$/, '') || '/'
        const allow = this.handler_book.get_allow(pathname)
        if (req.method === 'OPTIONS' && req.url === '*') {
            res.setHeader('Allow', 'OPTIONS,HEAD,GET,POST,PUT,DELETE')
            return reply(res, 204)
        }
        if (!allow) {
            return reply(res, 404)
        }
        if (!allow.includes(req.method)) {
            return reply(res, 405)
        }
        this.c_allow_origin && res.setHeader('Access-Control-Allow-Origin', this.c_allow_origin)
        if (req.method === 'OPTIONS') {
            res.setHeader('Allow', allow.join(','))
            this.c_allow_methods && res.setHeader('Access-Control-Allow-Methods', this.c_allow_methods)
            this.c_allow_headers && res.setHeader('Access-Control-Allow-Headers', this.c_allow_headers)
            this.c_cors_max_age && res.setHeader('Access-Control-Max-Age', this.c_cors_max_age)
            return reply(res, 204)
        } else {
            res.statusCode = 400
            res.statusMessage = HTTP_STATUS.message_of(400)
            const handler = this.handler_book.find(req.method as ApiMethod, pathname)!
            return handler(req, res, parsed_url)
        }
    }

    add_router(unit: RouteUnit, meta: TpRouter): void {
        const head = meta.path.replace(/\/+\s*$/g, '')
        const tail = unit.path_tail.replace(/^\s*\/+/g, '').replace(/\/+\s*$/g, '')
        const path = head + '/' + tail
        switch (unit.type) {
            case 'request': {
                const handler = this.make_request_handler(meta.injector!, unit)
                unit.methods.forEach(method => this.handler_book.record(path, { type: method, handler }))
                break
            }
            case 'socket': {
                const handler = this.make_upgrade_handler(meta.injector!, unit)
                this.handler_book.record(path, { type: 'SOCKET', handler })
                break
            }
        }
        this.handler_book.clear_cache()
    }

    private make_upgrade_handler(injector: Injector, unit: SocketUnit): UpgradeHandlerWithPathArgs {
        const param_deps = get_providers(unit, injector, SOCKET_TOKEN_SET)
        const proxy_config = this.c_proxy
        const need_guard = unit.auth || param_deps.find(d => d.token === Guard)

        const pv_authenticator = injector.get(HttpAuthenticator)!
        const pv_hooks = injector.get(HttpHooks)!

        return async function(req, socket, head, parsed_url, path_args): Promise<SocketHandler | undefined> {

            const authenticator = pv_authenticator.create()
            const http_hooks = pv_hooks.create()
            const request = new TpRequest(req, parsed_url, proxy_config)

            try {
                const guard = need_guard ? new Guard(await authenticator.get_credentials(request)) : undefined
                if (unit.auth) {
                    await authenticator.authenticate(guard!)
                }
            } catch (e) {
                socket.destroy()
                return
            }

            return async function(req: IncomingMessage, ws: WebSocket): Promise<void> {

                const socket_wrapper = new TpWebSocket(ws)

                socket_wrapper.on('close', code => http_hooks.on_ws_close(socket_wrapper, request, code))
                http_hooks.on_ws_init(socket_wrapper, request).catch(() => undefined)

                try {
                    const guard = need_guard ? new Guard(await authenticator.get_credentials(request)) : undefined
                    if (unit.auth) {
                        await authenticator.authenticate(guard!)
                    }

                    await unit.handler(...param_deps.map(({ provider, token }, index) => {
                        if (provider) {
                            return provider.create([{ token: `${unit.cls.name}.${unit.prop.toString()}`, index }])
                        }
                        switch (token) {
                            case TpWebSocket:
                                return socket_wrapper
                            case TpRequest:
                                return request
                            case Params:
                                return new Params(parsed_url.query)
                            case PathArgs:
                                return new PathArgs(path_args)
                            case Guard:
                                return guard
                            case RequestHeaders:
                                return new RequestHeaders(req.headers)
                            case IncomingMessage:
                                return req
                        }
                    }))

                } catch (reason: any) {
                    socket_wrapper.close(1011, `Error: ${reason.message}`)
                }
            }
        }
    }

    private make_request_handler(injector: Injector, unit: RequestUnit): RequestHandlerWithPathArgs {
        const param_deps = get_providers(unit, injector, ALL_HANDLER_TOKEN_SET)
        const body_max_length = this.c_body_max_length
        const proxy_config = this.c_proxy
        const reader = this.reader
        const need_guard = unit.auth || param_deps.find(d => d.token === Guard)

        const pv_authenticator = injector.get(HttpAuthenticator)!
        const pv_cache_proxy = injector.get(HttpCacheProxy)!
        const pv_hooks = injector.get(HttpHooks)!
        const pv_body_formatter = injector.get(HttpBodyFormatter)!

        return async function(
            req,
            res,
            parsed_url,
            path_args,
        ) {

            const cache_proxy = pv_cache_proxy.create()
            const http_hooks = pv_hooks.create()
            const formatter = pv_body_formatter.create()
            const authenticator = pv_authenticator.create()

            const request = new TpRequest(req, parsed_url, proxy_config)
            const response = new TpResponse(res, request)
            const context = new HttpContext(request, response)

            let stream: Readable = req
            if (body_max_length) {
                let received = 0
                stream = stream.pipe(new Transform({
                    transform(chunk: any, _: BufferEncoding, callback: TransformCallback) {
                        received += chunk.byteLength
                        if (received > body_max_length) {
                            stream.pause()
                            response.status = 413
                            response.body = response.message
                            flush_response(response)
                        } else {
                            callback(null, chunk)
                        }
                    }
                }))
            }

            await http_hooks.on_init(context).catch(() => undefined)

            try {
                let content: MIMEContent<any>

                if (param_deps.some(d => [MimeBody, FormBody, JsonBody, TextBody, RawBody].includes(d.token))) {
                    content = await reader.read(stream, {
                        content_type: req.headers['content-type'] || '',
                        content_encoding: req.headers['content-encoding'] || 'identity',
                        skip_deserialize: true,
                    })

                    request.type = content.type
                    request.charset = content.charset

                    if (param_deps.find(d => d.token === MimeBody)) {
                        await reader.deserialize(content)
                    }
                }

                const guard = need_guard ? new Guard(await authenticator.get_credentials(request)) : undefined
                if (unit.auth) {
                    await authenticator.authenticate(guard!)
                }

                const response_cache = param_deps.find(d => d.token === ResponseCache)
                    ? ResponseCache.create(cache_proxy, unit.cache_scope, unit.cache_expire_secs)
                    : undefined

                if (unit.content_type) {
                    response.content_type = unit.content_type
                }

                const result = await unit.handler(...param_deps.map(({ provider, token }, index) => {
                    if (provider) {
                        return provider.create([{ token: `${unit.cls.name}.${unit.prop.toString()}`, index }])
                    }
                    switch (token) {
                        case HttpContext:
                            return context
                        case TpRequest:
                            return request
                        case TpResponse:
                            return response
                        case ResponseCache:
                            return response_cache
                        case MimeBody:
                            return new MimeBody(content)
                        case FormBody:
                            return new FormBody(content)
                        case JsonBody:
                            return new JsonBody(content)
                        case TextBody:
                            return text_deserialize(content)
                        case RawBody:
                            return Buffer.from(content.raw)
                        case Guard:
                            return guard
                        case RequestHeaders:
                            return new RequestHeaders(req.headers)
                        case Params:
                            return new Params(parsed_url.query)
                        case PathArgs:
                            return new PathArgs(path_args)
                        case IncomingMessage:
                            return req
                        case ServerResponse:
                            return res
                    }
                }))
                context.result = TpHttpFinish.isTpHttpFinish(result) ? result : wrap_finish(result)
            } catch (reason) {
                if (reason instanceof Finish) {
                    await Promise.resolve(reason.response)
                        .then(res => context.result = wrap_finish(res))
                        .catch(err => context.result = TpHttpFinish.isTpHttpFinish(err) ? err : wrap_error(err))
                } else {
                    context.result = TpHttpFinish.isTpHttpFinish(reason) ? reason : wrap_error(reason)
                }
            }

            response.status = context.result.status

            if (context.result.status >= 400) {
                response.clear()
            }

            response.merge(context.result.headers)
            response.body = formatter.format(context)
            if (context.result.status < 400) {
                http_hooks.on_finish(context).catch(() => undefined)
            } else {
                http_hooks.on_error(context).catch(() => undefined)
            }

            flush_response(response)
        }
    }
}
