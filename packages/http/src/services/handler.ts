/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData } from '@tarpit/config'
import { get_providers, Injector, TpService } from '@tarpit/core'
import { IncomingMessage, ServerResponse } from 'http'
import { UrlWithParsedQuery } from 'url'
import { ApiMethod, ApiPath, HttpHandler, HttpHandlerDescriptor, HttpHandlerKey } from '../__types__'
import { TpRouter } from '../annotations'
import { BodyDetector, FormBody, Guardian, HttpContext, JsonBody, Params, RawBody, RequestHeader, ResponseCache, TextBody, TpRequest, TpResponse } from '../builtin'
import { Finish, StandardError, throw_native_error, TpHttpError } from '../errors'
import { RouteUnit } from '../tools/collect-routes'
import { HTTP_STATUS } from '../tools/http-status'
import { on_error } from '../tools/on-error'
import { on_finish } from '../tools/on-finished'
import { BodyReader } from './body-reader'
import { AbstractAuthenticator } from './inner/abstract-authenticator'
import { AbstractCacheProxy } from './inner/abstract-cache-proxy'
import { AbstractErrorFormatter } from './inner/abstract-error-formatter'
import { AbstractLifeCycle } from './inner/abstract-life-cycle'
import { AbstractResponseFormatter } from './inner/abstract-response-formatter'
import { URLParser } from './url-parser'

const BODY_TOKEN: any[] = [BodyDetector, JsonBody, FormBody, TextBody, RawBody]
const REQUEST_TOKEN: any[] = [RequestHeader, Guardian, Params, IncomingMessage, TpRequest]
const RESPONSE_TOKEN: any[] = [ServerResponse, TpResponse]
const ALL_HANDLER_TOKEN: any[] = [HttpContext, ResponseCache].concat(BODY_TOKEN, REQUEST_TOKEN, RESPONSE_TOKEN)
const ALL_HANDLER_TOKEN_SET = new Set(ALL_HANDLER_TOKEN)

@TpService()
export class Handler {

    private handlers = new Map<HttpHandlerKey, HttpHandler>()
    private proxy_config = this.config_data.get('http.proxy')

    constructor(
        private config_data: ConfigData,
        private url_parser: URLParser,
        private body_reader: BodyReader,
    ) {
    }

    list(need_handler?: boolean): HttpHandlerDescriptor[] | Omit<HttpHandlerDescriptor, 'handler'>[] {
        return Array.from(this.handlers.keys()).sort().map(mp => {
            const [, method, path] = /^(GET|POST|PUT|DELETE)-(.+)$/.exec(mp) ?? []
            return {
                path,
                method: method as ApiMethod,
                handler: need_handler ? this.handlers.get(mp) : undefined
            }
        })
    }

    bind(method: ApiMethod, path: ApiPath, handler: HttpHandler): void {
        if (Array.isArray(path)) {
            for (const p of path) {
                this.handlers.set(`${method}-${p}`, handler)
            }
        } else {
            this.handlers.set(`${method}-${path}`, handler)
        }
    }

    async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {

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

    load(unit: RouteUnit, injector: Injector, meta: TpRouter): void {
        const router_handler = this.make_router(injector, unit)
        const prefix = meta.path.replace(/\/{2,}/g, '/').replace(/\/\s*$/g, '')
        const suffix = unit.path_tail.replace(/(^\/|\/$)/g, '')
        const full_path = prefix + '/' + suffix

        unit.get && this.bind('GET', full_path, router_handler)
        unit.post && this.bind('POST', full_path, router_handler)
        unit.put && this.bind('PUT', full_path, router_handler)
        unit.delete && this.bind('DELETE', full_path, router_handler)
    }

    private make_router(injector: Injector, unit: RouteUnit) {

        const provider_list = get_providers(unit, injector, ALL_HANDLER_TOKEN_SET)
        const proxy_config = this.proxy_config
        const body_reader = this.body_reader
        const cache_proxy_provider = injector.get(AbstractCacheProxy) ?? throw_native_error('No provider for AbstractCacheProxy')
        const life_cycle_provider = injector.get(AbstractLifeCycle) ?? throw_native_error('No provider for AbstractLifeCycle')
        const response_formatter_provider = injector.get(AbstractResponseFormatter) ?? throw_native_error('No provider for AbstractResponseFormatter')
        const error_formatter_provider = injector.get(AbstractErrorFormatter) ?? throw_native_error('No provider for AbstractErrorFormatter')

        return async function(req: IncomingMessage, res: ServerResponse, parsed_url: UrlWithParsedQuery) {

            const cache_proxy = cache_proxy_provider.create()
            const life_cycle = life_cycle_provider.create()
            const response_formatter = response_formatter_provider.create()
            const error_formatter = error_formatter_provider.create()

            const request = new TpRequest(req, parsed_url, proxy_config)
            const response = new TpResponse(res, request)
            const context = new HttpContext(unit, request, response)

            await life_cycle?.on_init(context)

            let handle_result: any

            async function handle() {

                const buf = await body_reader.read(req)

                const auth_info = provider_list.includes(Guardian)
                    ? await injector.get(AbstractAuthenticator)?.create().auth(request)
                    : undefined

                const response_cache = provider_list.includes(ResponseCache)
                    ? ResponseCache.create(cache_proxy, unit.cache_scope, unit.cache_expire_secs)
                    : undefined

                return unit.handler(...provider_list.map((provider: any, index) => {
                    if (!ALL_HANDLER_TOKEN_SET.has(provider)) {
                        return provider?.create([{ token: `${unit.cls.name}.${unit.prop.toString()}`, index }])
                    }
                    switch (provider) {
                        case undefined:
                            return undefined
                        case HttpContext:
                            return context
                        case TpRequest:
                            return request
                        case TpResponse:
                            return response
                        case ResponseCache:
                            return response_cache
                        case BodyDetector:
                            return BodyDetector.parse(request, buf)
                        case FormBody:
                            return FormBody.parse(request, buf)
                        case JsonBody:
                            return JsonBody.parse(request, buf)
                        case TextBody:
                            return TextBody.parse(request, buf)
                        case RawBody:
                            return RawBody.parse(request, buf)
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
                            return provider?.create()
                    }
                }))
            }

            try {
                handle_result = await handle()
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
                await life_cycle?.on_error(context, handle_result)
                response.status = handle_result.status
                response.body = error_formatter.format(context, handle_result)
            } else {
                await life_cycle?.on_finish(context, handle_result)
                response.status = 200
                response.body = response_formatter.format(context, handle_result)
            }
            response.respond()
        }
    }
}