/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ImportsAndProviders, TpAssemblyCommon, TpUnitCommon } from '@tarpit/core'
import Koa from 'koa'
import { Stream } from 'stream'

/**
 * Koa 支持的响应体类型。
 *
 * [[include:types/koa-response-type.md]]
 */
export type KoaResponseType = string | Buffer | Stream | Object | Array<any> | null

export type LiteContext = Koa.Context & {
    process_start?: number
}

export type HandlerReturnType<R extends KoaResponseType> = R | Promise<R>
export type HttpHandler = (ctx: LiteContext) => HandlerReturnType<any>
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

export interface TpRouterMeta extends TpAssemblyCommon<'TpRouter'> {
    router_path: `/${string}`
    router_options?: TpRouterOptions
    path_replacement: Record<string, string>
}

export interface TpRouterUnit<T extends (...args: any) => any> extends TpUnitCommon<T> {
    u_type: 'TpRouterUnit'
    uh_path: string
    uh_get?: boolean
    uh_post?: boolean
    uh_put?: boolean
    uh_delete?: boolean
    uh_auth: boolean
    uh_wrap_result: boolean
    uh_cache_prefix?: string
    uh_cache_expires?: number
}
