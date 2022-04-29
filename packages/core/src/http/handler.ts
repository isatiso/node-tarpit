/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Request } from 'koa'
import { get_providers, Injector, RouterFunction, TpRouterMeta } from '../core'
import { Authenticator } from '../service/authenticator'
import { CacheProxy } from '../service/cache-proxy'
import { LifeCycle } from '../service/life-cycle'
import { ResultWrapper } from '../service/result-wrapper'
import { ApiMethod, ApiPath, HandlerReturnType, HttpHandler, HttpHandlerDescriptor, HttpHandlerKey, KoaResponseType, LiteContext } from './__type__'
import { ApiParams, PURE_PARAMS } from './api-params'
import { HttpError, InnerFinish, OuterFinish, reasonable } from './error'
import { SessionContext } from './session-context'

function finish_process(koa_context: LiteContext, response_body: KoaResponseType) {
    koa_context.response.body = response_body
}

function do_wrap(result_wrapper: ResultWrapper | undefined, data: any, context: SessionContext) {
    if (!result_wrapper) {
        return data
    }
    const res = result_wrapper?.wrap(data, context)
    return res === undefined ? data : res
}

function do_wrap_error(result_wrapper: ResultWrapper | undefined, err: HttpError<any>, context: SessionContext) {
    if (!result_wrapper) {
        return { error: err.err_data }
    }
    const res = result_wrapper?.wrap_error(err, context)
    return res === undefined ? { error: err.err_data } : res
}

/**
 * @private
 */
export class Handler {

    private handlers: { [path: HttpHandlerKey]: HttpHandler } = {}

    list(need_handler?: boolean): HttpHandlerDescriptor[] | Omit<HttpHandlerDescriptor, 'handler'>[] {
        return Object.keys(this.handlers).sort().map((mp) => {
            const [, method, path] = /^(GET|POST|PUT|DELETE)-(.+)$/.exec(mp) ?? []
            return {
                method: method as ApiMethod,
                path: path,
                handler: need_handler ? this.handlers[mp as HttpHandlerKey] : undefined
            }
        })
    }

    on<T, R extends KoaResponseType>(method: ApiMethod, path: ApiPath, handler: (params: T, ctx: LiteContext) => HandlerReturnType<R>): void {
        if (Array.isArray(path)) {
            for (const p of path) {
                this.handlers[`${method}-${p}`] = handler
            }
        } else {
            this.handlers[`${method}-${path}`] = handler
        }
    }

    async handle(context: LiteContext, next: Function) {
        const req: Request & { body?: any } = context.request
        const params = req.method === 'GET' || req.method === 'DELETE' ? req.query : req.body
        const handler = this.handlers[`${req.method as ApiMethod}-${req.path}`]
        if (!handler) {
            return next()
        }
        await handler(params, context)
        return next()
    }

    load(router_function: RouterFunction<any>, injector: Injector, meta: TpRouterMeta): void {
        if (!router_function.meta?.disabled) {
            const router_handler = this.make_router(injector, router_function, [ApiParams, SessionContext, PURE_PARAMS])
            const prefix = meta.router_path.replace(/\/{2,}/g, '/').replace(/\/\s*$/g, '')
            const suffix = router_function.path.replace(/(^\/|\/$)/g, '')
            const full_path = prefix + '/' + suffix

            router_function.GET && this.on('GET', full_path, router_handler)
            router_function.POST && this.on('POST', full_path, router_handler)
            router_function.PUT && this.on('PUT', full_path, router_handler)
            router_function.DELETE && this.on('DELETE', full_path, router_handler)
        }
    }

    private make_router(injector: Injector, desc: RouterFunction<any>, except_list?: any[]) {

        const provider_list = get_providers(desc, injector, except_list)

        return async function(params: any, koa_context: LiteContext) {

            const cache = injector.get(CacheProxy)?.create()
            const result_wrapper = injector.get(ResultWrapper)?.create()
            const hooks = injector.get(LifeCycle)?.create()
            const authenticator = injector.get(Authenticator)?.create()

            const auth_info = await authenticator?.auth(koa_context)

            const context = new SessionContext(koa_context, auth_info, cache, desc.cache_prefix, desc.cache_expires)

            await hooks?.on_init(context)

            if (desc.auth) {
                if (!authenticator) {
                    const err = new HttpError(new Error('no provider for <Authenticator>.'))
                    await hooks?.on_error(context, err)
                    const err_result = desc.wrap_result ? do_wrap_error(result_wrapper, err, context) : { error: err.err_data }
                    return finish_process(koa_context, err_result)
                }
                if (auth_info === undefined) {
                    const err = new HttpError(reasonable(401, 'Unauthorized.'))
                    await hooks?.on_error(context, err)
                    const err_result = desc.wrap_result ? do_wrap_error(result_wrapper, err, context) : { error: err.err_data }
                    return finish_process(koa_context, err_result)
                }
            }

            const param_list = provider_list.map((provider: any) => {
                if (provider === undefined) {
                    return undefined
                } else if (provider === PURE_PARAMS) {
                    return params
                } else if (provider === ApiParams) {
                    return new ApiParams(params)
                } else if (provider === SessionContext) {
                    return context
                } else {
                    return provider.create()
                }
            })

            let handler_result: any

            try {
                handler_result = await desc.handler(...param_list)
            } catch (reason) {
                if (reason instanceof InnerFinish) {
                    handler_result = await reason.body
                } else if (reason instanceof OuterFinish) {
                    handler_result = reason
                } else {
                    handler_result = new HttpError(reason)
                }
            }

            if (handler_result instanceof HttpError) {
                await hooks?.on_error(context, handler_result)
                const err_response = desc.wrap_result ? do_wrap_error(result_wrapper, handler_result, context) : { error: handler_result.err_data }
                finish_process(koa_context, err_response)
            } else if (handler_result instanceof OuterFinish) {
                await hooks?.on_finish(context)
                finish_process(koa_context, await handler_result.body)
            } else {
                await hooks?.on_finish(context)
                const normal_res = desc.wrap_result ? do_wrap(result_wrapper, handler_result, context) : handler_result
                finish_process(koa_context, normal_res)
            }
        }
    }
}
