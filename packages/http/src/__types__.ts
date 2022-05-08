/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BasePropertyFunction, BaseTpModuleMeta, ImportsAndProviders, Injector } from '@tarpit/core'
import { ExtendableContext } from 'koa'
import { Stream } from 'stream'

/**
 * Koa 支持的响应体类型。
 *
 * [[include:types/koa-response-type.md]]
 */
export type KoaResponseType = string | Buffer | Stream | Object | Array<any> | null

export type LiteContext = ExtendableContext & {
    process_start?: number
}

export type HandlerReturnType<R extends KoaResponseType> = R | Promise<R>
export type HttpHandler = (params: any, ctx: LiteContext) => HandlerReturnType<any>
export type HttpHandlerKey = `${ApiMethod}-${string}`

export interface HttpHandlerDescriptor {
    method: ApiMethod,
    path: string
    handler: HttpHandler
}

export type ApiPath = string | string[]
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface TpHttpSession {

}

export interface TpHttpAuthInfo {

}

export interface TpRouterOptions extends ImportsAndProviders {

}

export interface TpRouterMeta extends BaseTpModuleMeta<'TpRouter'> {
    type: 'TpRouter'
    router_path: `/${string}`
    router_options?: TpRouterOptions
    path_replacement: Record<string, string>
    function_collector: () => RouterFunction<any>[]
    on_load: (meta: TpRouterMeta, injector: Injector) => void
}

export interface RouterFunction<T extends (...args: any) => any> extends BasePropertyFunction<T> {
    type: 'TpRouterFunction'
    path: string
    GET?: boolean
    POST?: boolean
    PUT?: boolean
    DELETE?: boolean
    auth: boolean
    wrap_result: boolean
    cache_prefix?: string
    cache_expires?: number
}

declare module '@tarpit/core' {
    export interface TpModuleLikeCollector {
        TpRouter: TpRouterMeta
    }
}

declare module '@tarpit/config' {
    export interface TpConfigSchema {
        http: {
            port: number
            keepalive_timeout?: number
            cors?: {
                allow_origin: string
                allow_headers: string
                allow_methods: string
            }
        }
    }
}
