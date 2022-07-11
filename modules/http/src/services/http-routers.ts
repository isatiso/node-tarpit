/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData } from '@tarpit/config'
import { ContentReaderService } from '@tarpit/content-type'
import { get_providers, Injector, TpService } from '@tarpit/core'
import { throw_native_error } from '@tarpit/error'
import { IncomingMessage, ServerResponse } from 'http'
import { UrlWithParsedQuery } from 'url'
import { ApiMethod, HttpHandler, HttpHandlerKey } from '../__types__'
import { TpRouter } from '../annotations'
import { FormBody, Guardian, HttpContext, JsonBody, MimeBody, Params, RawBody, RequestHeader, ResponseCache, TextBody, TpRequest, TpResponse } from '../builtin'
import { Finish, StandardError, TpHttpError } from '../errors'
import { RouteUnit } from '../tools/collect-routes'
import { HTTP_STATUS } from '../tools/http-status'
import { on_error } from '../tools/on-error'
import { on_finish } from '../tools/on-finished'
import { HttpServer } from './http-server'
import { HttpUrlParser } from './http-url-parser'
import { AbstractAuthenticator } from './inner/abstract-authenticator'
import { AbstractCacheProxy } from './inner/abstract-cache-proxy'
import { AbstractErrorFormatter } from './inner/abstract-error-formatter'
import { AbstractHttpHooks } from './inner/abstract-http-hooks'
import { AbstractResponseFormatter } from './inner/abstract-response-formatter'

const BODY_TOKEN: any[] = [MimeBody, JsonBody, FormBody, TextBody, RawBody]
const REQUEST_TOKEN: any[] = [RequestHeader, Guardian, Params, IncomingMessage, TpRequest]
const RESPONSE_TOKEN: any[] = [ServerResponse, TpResponse]
const ALL_HANDLER_TOKEN: any[] = [HttpContext, ResponseCache].concat(BODY_TOKEN, REQUEST_TOKEN, RESPONSE_TOKEN)
const ALL_HANDLER_TOKEN_SET = new Set(ALL_HANDLER_TOKEN)

@TpService({ inject_root: true })
export class HttpRouters {

    public readonly handlers = new Map<HttpHandlerKey, HttpHandler>()

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
        res.statusCode = 404
        this.c_allow_origin && res.setHeader('Access-Control-Allow-Origin', this.c_allow_origin)
        if (req.method === 'OPTIONS') {
            this.c_allow_headers && res.setHeader('Access-Control-Allow-Headers', this.c_allow_headers)
            this.c_allow_methods && res.setHeader('Access-Control-Allow-Methods', this.c_allow_methods)
            this.c_cors_max_age && res.setHeader('Access-Control-Max-Age', this.c_cors_max_age)
            res.statusCode = 204
            res.end('')
            return
        }
        return this.common_handler(req, res)
    }

    add_router(unit: RouteUnit, meta: TpRouter): void {
        const router = this.make_router(meta.injector!, unit)
        const prefix = meta.path.replace(/\/{2,}/g, '/').replace(/\/\s*$/g, '')
        const suffix = unit.path_tail.replace(/(^\/|\/$)/g, '')
        const full_path = prefix + '/' + suffix

        unit.get && this.handlers.set(`GET-${full_path}`, router)
        unit.post && this.handlers.set(`POST-${full_path}`, router)
        unit.put && this.handlers.set(`PUT-${full_path}`, router)
        unit.delete && this.handlers.set(`DELETE-${full_path}`, router)
    }

    private async common_handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
        on_finish(res, err => on_error(err, req, res))
        const parsed_url = this.url_parser.parse(req)
        if (parsed_url) {
            const method: ApiMethod = req.method === 'HEAD' ? 'GET' : req.method as ApiMethod
            const handler = this.handlers.get(`${method}-${parsed_url.pathname}`)
            if (handler) {
                return handler(req, res, parsed_url)
            }
        }
        res.getHeaderNames().forEach(name => res.removeHeader(name))
        res.statusCode = 404
        const msg = HTTP_STATUS.message_of(404)
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.setHeader('Content-Length', Buffer.byteLength(msg))
        res.end(msg)
    }

    private make_router(injector: Injector, unit: RouteUnit) {

        const param_deps = get_providers(unit, injector, ALL_HANDLER_TOKEN_SET)
        const body_max_length = this.c_body_max_length
        const proxy_config = this.c_proxy
        const reader = this.reader
        const provider_cp = injector.get(AbstractCacheProxy) ?? throw_native_error('No provider for AbstractCacheProxy')
        const provider_ef = injector.get(AbstractErrorFormatter) ?? throw_native_error('No provider for AbstractErrorFormatter')
        const provider_hh = injector.get(AbstractHttpHooks) ?? throw_native_error('No provider for AbstractHttpHooks')
        const provider_rf = injector.get(AbstractResponseFormatter) ?? throw_native_error('No provider for AbstractResponseFormatter')

        return async function(req: IncomingMessage, res: ServerResponse, parsed_url: UrlWithParsedQuery) {

            const cache_proxy = provider_cp.create()
            const error_formatter = provider_ef.create()
            const http_hooks = provider_hh.create()
            const response_formatter = provider_rf.create()

            const content_type = req.headers['content-type'] || ''
            const content_encoding = req.headers['content-encoding'] || 'identity'

            const request = new TpRequest(req, parsed_url, proxy_config)
            const response = new TpResponse(res, request)
            const context = new HttpContext(unit, request, response)

            await http_hooks?.on_init(context)

            let handle_result: any

            if (body_max_length) {
                let received = 0
                req.on('data', chunk => {
                    received += chunk.byteLength
                    if (received > body_max_length) {
                        req.pause()
                        response.respond(413)
                    }
                })
            }

            try {

                const content = await reader.read(req, {
                    content_encoding,
                    content_type,
                    skip_deserialize: true,
                })

                request.type = content.type
                request.charset = content.charset

                if (param_deps.find(d => d.token === MimeBody)) {
                    await reader.deserialize(content)
                }

                const auth_info = param_deps.find(d => d.token === Guardian)
                    ? await injector.get(AbstractAuthenticator)?.create().auth(request)
                    : undefined

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
                            return new TextBody(content)
                        case RawBody:
                            return new RawBody(content)
                        case Guardian:
                            return new Guardian(auth_info)
                        case RequestHeader:
                            return new RequestHeader(req.headers)
                        case Params:
                            return new Params(parsed_url.query)
                        case IncomingMessage:
                            return req
                        case ServerResponse:
                            return res
                        default:
                            return undefined
                    }
                }))
            } catch (reason) {
                if (reason instanceof Finish) {
                    handle_result = await reason.response
                } else if (reason instanceof TpHttpError) {
                    handle_result = reason
                } else {
                    handle_result = new StandardError(500, 'Internal Server Error', { origin: reason })
                }
            }

            if (handle_result instanceof TpHttpError) {
                await http_hooks?.on_error(context, handle_result)
                response.status = handle_result.status
                response.body = error_formatter.format(context, handle_result)
            } else {
                await http_hooks?.on_finish(context, handle_result)
                response.status = 200
                response.body = response_formatter.format(context, handle_result)
            }
            response.respond()
        }
    }
}
