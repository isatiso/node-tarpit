/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { get_providers, Injector } from '@tarpit/core'
import { AbstractAuthenticator } from './__services__/abstract-authenticator'
import { AbstractCacheProxy } from './__services__/abstract-cache-proxy'
import { AbstractLifeCycle } from './__services__/abstract-life-cycle'
import { AbstractResultWrapper } from './__services__/abstract-result-wrapper'
import { ApiMethod, ApiPath, HandlerReturnType, HttpHandler, HttpHandlerDescriptor, HttpHandlerKey, KoaResponseType, LiteContext, TpRouterMeta, TpRouterUnit } from './__types__'
import { ApiParams, AUTO_BODY, AutoBody, BodyParser, FORM_BODY, FormBody, Guardian, HttpHeader, JSON_BODY, JsonBody, ParsedQuery, SessionContext, TEXT_BODY, TextBody } from './builtin'
import { HttpError, InnerFinish, OuterFinish, ReasonableError } from './error'

function finish_process(koa_context: LiteContext, response_body: KoaResponseType) {
    koa_context.response.body = response_body
}

/**
 * @private
 */
export class Handler {

    private handlers = new Map<HttpHandlerKey, HttpHandler>()
    private body_type_set = new Set([AutoBody, AUTO_BODY, JsonBody, JSON_BODY, FormBody, FORM_BODY, TextBody, TEXT_BODY])

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

    on<R extends KoaResponseType>(method: ApiMethod, path: ApiPath, handler: (ctx: LiteContext) => HandlerReturnType<R>): void {
        if (Array.isArray(path)) {
            for (const p of path) {
                this.handlers.set(`${method}-${p}`, handler)
            }
        } else {
            this.handlers.set(`${method}-${path}`, handler)
        }
    }

    async handle(context: LiteContext, next: Function) {
        await this.handlers.get(`${context.request.method as ApiMethod}-${context.request.path}`)?.(context)
        return next()
    }

    load(unit: TpRouterUnit<any>, injector: Injector, meta: TpRouterMeta): void {
        if (!unit.u_meta?.disabled) {
            const router_handler = this.make_router(injector, unit)
            const prefix = meta.router_path.replace(/\/{2,}/g, '/').replace(/\/\s*$/g, '')
            const suffix = unit.uh_path.replace(/(^\/|\/$)/g, '')
            const full_path = prefix + '/' + suffix

            unit.uh_get && this.on('GET', full_path, router_handler)
            unit.uh_post && this.on('POST', full_path, router_handler)
            unit.uh_put && this.on('PUT', full_path, router_handler)
            unit.uh_delete && this.on('DELETE', full_path, router_handler)
        }
    }

    private get_parser(injector: Injector, body_type: any): ((koa_context: LiteContext) => Promise<any>) | undefined {
        if (body_type) {
            const body_parser = injector.get(BodyParser)!.create()
            switch (body_type) {
                case AutoBody:
                case AUTO_BODY:
                    return (koa_context: LiteContext) => body_parser.guess_and_parse(koa_context)
                case JsonBody:
                case JSON_BODY:
                    return (koa_context: LiteContext) => body_parser.parse_json(koa_context)
                case FormBody:
                case FORM_BODY:
                    return (koa_context: LiteContext) => body_parser.parse_form(koa_context)
                case TextBody:
                case TEXT_BODY:
                    return (koa_context: LiteContext) => body_parser.parse_text(koa_context)
            }
        }
    }

    private make_router(injector: Injector, desc: TpRouterUnit<any>) {

        const except_list = [SessionContext, AutoBody, AUTO_BODY, JsonBody, JSON_BODY, FormBody, FORM_BODY, TextBody, TEXT_BODY, ParsedQuery, HttpHeader, Guardian]
        const provider_list = get_providers(desc, injector, except_list)
        const body_type = provider_list.find(value => this.body_type_set.has(value))
        const body_parser = this.get_parser(injector, body_type)

        return async function(koa_context: LiteContext) {

            const cache = injector.get(AbstractCacheProxy)?.create()
            const result_wrapper = injector.get(AbstractResultWrapper)!.create()
            const life_cycle = injector.get(AbstractLifeCycle)?.create()
            const context = new SessionContext(koa_context, cache, desc.uh_cache_prefix, desc.uh_cache_expires)
            await life_cycle?.on_init(context)

            let handler_result: any
            let body: any
            let auth_info: any

            async function figure_result() {
                try {
                    body = await body_parser?.(koa_context)
                } catch (err) {
                    throw new ReasonableError(400, 'Bad Request')
                }

                if (provider_list.includes(Guardian)) {
                    const authenticator = injector.get(AbstractAuthenticator)?.create()
                    if (!authenticator) {
                        throw new HttpError(new Error('no provider for <AbstractAuthenticator>.'))
                    }
                    auth_info = await authenticator?.auth(koa_context)
                }

                return desc.u_handler(...provider_list.map((provider: any) => {
                    switch (provider) {
                        case undefined:
                            return undefined
                        case AutoBody:
                        case FormBody:
                        case JsonBody:
                        case TextBody:
                            return new ApiParams(body)
                        case AUTO_BODY:
                        case FORM_BODY:
                        case JSON_BODY:
                        case TEXT_BODY:
                            return body
                        case Guardian:
                            return new Guardian(auth_info)
                        case HttpHeader:
                            return new HttpHeader(koa_context.headers)
                        case ParsedQuery:
                            return new ParsedQuery(koa_context.query)
                        case SessionContext:
                            return context
                        default:
                            return provider.create()
                    }
                }))
            }

            try {
                handler_result = await figure_result()
            } catch (reason) {
                if (reason instanceof InnerFinish) {
                    handler_result = await reason.body
                } else if (reason instanceof OuterFinish) {
                    handler_result = reason
                } else if (reason instanceof HttpError) {
                    handler_result = reason
                } else {
                    handler_result = new HttpError(reason)
                }
            }

            if (handler_result instanceof HttpError) {
                await life_cycle?.on_error(context, handler_result)
                const err_response = desc.uh_wrap_result ? result_wrapper.wrap_error(handler_result, context) : { error: handler_result.err_data }
                finish_process(koa_context, err_response)
            } else if (handler_result instanceof OuterFinish) {
                await life_cycle?.on_finish(context)
                finish_process(koa_context, await handler_result.body)
            } else {
                await life_cycle?.on_finish(context)
                const normal_res = desc.uh_wrap_result ? result_wrapper.wrap(handler_result, context) : handler_result
                finish_process(koa_context, normal_res)
            }
        }
    }
}
