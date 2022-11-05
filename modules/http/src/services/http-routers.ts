/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData } from '@tarpit/config'
import { ContentReaderService, text_deserialize } from '@tarpit/content-type'
import { get_providers, Injector, TpService } from '@tarpit/core'
import { IncomingMessage, ServerResponse } from 'http'
import { Readable, Transform, TransformCallback } from 'stream'
import { FatHttpHandler } from '../__types__'
import { TpRouter } from '../annotations'
import { FormBody, Guard, HttpContext, JsonBody, MimeBody, Params, PathArgs, RawBody, RequestHeaders, ResponseCache, TextBody, TpRequest, TpResponse } from '../builtin'
import { Finish, StandardError, TpHttpError } from '../errors'
import { RouteUnit } from '../tools/collect-routes'
import { flush_response } from '../tools/flush-response'
import { HandlerBook } from '../tools/handler-book'
import { CODES_KEY, HTTP_STATUS } from '../tools/http-status'
import { HttpAuthenticator } from './http-authenticator'
import { HttpCacheProxy } from './http-cache-proxy'
import { HttpErrorFormatter } from './http-error-formatter'
import { HttpHooks } from './http-hooks'
import { HttpResponseFormatter } from './http-response-formatter'
import { HttpServer } from './http-server'
import { HttpUrlParser } from './http-url-parser'

const BODY_TOKEN: any[] = [MimeBody, JsonBody, FormBody, TextBody, RawBody]
const REQUEST_TOKEN: any[] = [RequestHeaders, Guard, Params, PathArgs, IncomingMessage, TpRequest]
const RESPONSE_TOKEN: any[] = [ServerResponse, TpResponse]
const ALL_HANDLER_TOKEN: any[] = [HttpContext, ResponseCache].concat(BODY_TOKEN, REQUEST_TOKEN, RESPONSE_TOKEN)
const ALL_HANDLER_TOKEN_SET = new Set(ALL_HANDLER_TOKEN)

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
    return new StandardError(500, 'Internal Server Error', { origin: err })
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
        private server: HttpServer,
        private config_data: ConfigData,
        private url_parser: HttpUrlParser,
        private reader: ContentReaderService,
    ) {
    }

    public readonly request_listener = async (req: IncomingMessage, res: ServerResponse) => {
        const parsed_url = this.url_parser.parse({ url: req.url, headers: req.headers })
        // istanbul ignore if
        if (!parsed_url || !req.method) {
            return reply(res, 400)
        }
        // istanbul ignore next
        parsed_url.pathname = parsed_url.pathname || '/'
        const allow = this.handler_book.get_allow(parsed_url.pathname)
        if (!allow) {
            return reply(res, 404)
        }
        if (!allow.includes(req.method)) {
            return reply(res, 405)
        }
        this.c_allow_origin && res.setHeader('Access-Control-Allow-Origin', this.c_allow_origin)
        if (req.method === 'OPTIONS') {
            // istanbul ignore if
            if (req.url === '*') {
                res.setHeader('Allow', 'OPTIONS,HEAD,GET,POST,PUT,DELETE')
            } else {
                res.setHeader('Allow', allow.join(','))
                this.c_allow_methods && res.setHeader('Access-Control-Allow-Methods', this.c_allow_methods)
                this.c_allow_headers && res.setHeader('Access-Control-Allow-Headers', this.c_allow_headers)
                this.c_cors_max_age && res.setHeader('Access-Control-Max-Age', this.c_cors_max_age)
            }
            return reply(res, 204)
        } else {
            res.statusCode = 400
            res.statusMessage = HTTP_STATUS.message_of(400)
            const handler = this.handler_book.find(req.method as any, parsed_url.pathname)!
            return handler(req, res, parsed_url)
        }
    }

    add_router(unit: RouteUnit, meta: TpRouter): void {
        const fat_handler = this.make_fat_handler(meta.injector!, unit)
        const head = meta.path.replace(/\/+\s*$/g, '')
        const tail = unit.path_tail.replace(/^\s*\/+/g, '').replace(/\/+\s*$/g, '')
        const path = head + '/' + tail

        unit.methods.forEach(method => this.handler_book.record(method, path, fat_handler))
        this.handler_book.clear_cache()
    }

    private make_fat_handler(injector: Injector, unit: RouteUnit): FatHttpHandler {
        const param_deps = get_providers(unit, injector, ALL_HANDLER_TOKEN_SET)
        const body_max_length = this.c_body_max_length
        const proxy_config = this.c_proxy
        const reader = this.reader
        const need_guard = unit.auth || param_deps.find(d => d.token === Guard)

        const pv_authenticator = injector.get(HttpAuthenticator)!
        const pv_cache_proxy = injector.get(HttpCacheProxy)!
        const pv_hooks = injector.get(HttpHooks)!
        const pv_error_formatter = injector.get(HttpErrorFormatter)!
        const pv_response_formatter = injector.get(HttpResponseFormatter)!

        return async function(
            req,
            res,
            parsed_url,
            path_args,
        ) {

            const cache_proxy = pv_cache_proxy.create()
            const error_formatter = pv_error_formatter.create()
            const http_hooks = pv_hooks.create()
            const response_formatter = pv_response_formatter.create()
            const authenticator = pv_authenticator.create()

            const request = new TpRequest(req, parsed_url, proxy_config)
            const response = new TpResponse(res, request)
            const context = new HttpContext(request, response)

            let handle_result: any
            let stream: Readable = req
            if (body_max_length) {
                let received = 0
                stream = stream.pipe(new Transform({
                    transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
                        received += chunk.byteLength
                        if (received > body_max_length) {
                            stream.pause()
                            response.status = 413
                            flush_response(response)
                        } else {
                            callback(null, chunk)
                        }
                    }
                }))
            }

            await http_hooks.on_init(context).catch(() => undefined)

            try {

                const content = await reader.read(stream, {
                    content_type: req.headers['content-type'] || '',
                    content_encoding: req.headers['content-encoding'] || 'identity',
                    skip_deserialize: true,
                })

                request.type = content.type
                request.charset = content.charset

                if (param_deps.find(d => d.token === MimeBody)) {
                    await reader.deserialize(content)
                }

                const guard = need_guard ? new Guard(await authenticator.get_credentials(request)) : undefined
                if (unit.auth) {
                    await authenticator.authenticate(guard!)
                }

                const response_cache = param_deps.find(d => d.token === ResponseCache)
                    ? ResponseCache.create(cache_proxy, unit.cache_scope, unit.cache_expire_secs)
                    : undefined

                handle_result = await unit.handler(...param_deps.map(({ provider, token }, index) => {
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
            } catch (reason) {
                if (reason instanceof Finish) {
                    handle_result = await Promise.resolve(reason.response)
                        .catch((err: any) => err instanceof TpHttpError ? err : wrap_error(err))
                } else if (reason instanceof TpHttpError) {
                    handle_result = reason
                } else {
                    handle_result = wrap_error(reason)
                }
            }

            if (handle_result instanceof TpHttpError) {
                Object.entries(handle_result.headers).forEach(([k, v]) => response.set(k, v))
                response.status = handle_result.status
                response.body = error_formatter.format(context, handle_result)
                await http_hooks.on_error(context, handle_result).catch(() => undefined)
            } else {
                response.body = response_formatter.format(context, handle_result)
                await http_hooks.on_finish(context, handle_result).catch(() => undefined)
            }

            flush_response(response)
        }
    }
}
