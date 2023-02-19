/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { make_abstract_decorator, make_decorator, TpEntry, TpUnit } from '@tarpit/core'
import { ApiMethod, TpRouterOptions, TpWebSocketOptions } from './__types__'

export type RouteProps = { path_tail?: string, methods: ApiMethod[] }

export const TpHttpToken = Symbol.for('œœ.token.http.TpHttp')

export type TpHttp = InstanceType<typeof TpHttp>
export const TpHttp = make_abstract_decorator('TpHttp', TpUnit)

export type Route = InstanceType<typeof Route>
export const Route = make_decorator('Route', (methods: ApiMethod[], path_tail?: string): RouteProps => ({ path_tail, methods }), TpHttp)

export type Auth = InstanceType<typeof Auth>
export const Auth = make_decorator('Auth', () => ({}), TpHttp)

export type CacheUnder = InstanceType<typeof CacheUnder>
export const CacheUnder = make_decorator('CacheUnder', (scope: string, expire_secs?: number) => ({ scope, expire_secs: expire_secs ?? 0 }), TpHttp)

export type Get = InstanceType<typeof Get>
export const Get = make_decorator('Get', (path_tail?: string): RouteProps => ({ path_tail, methods: ['GET'] }), Route)

export type Post = InstanceType<typeof Post>
export const Post = make_decorator('Post', (path_tail?: string): RouteProps => ({ path_tail, methods: ['POST'] }), Route)

export type Put = InstanceType<typeof Put>
export const Put = make_decorator('Put', (path_tail?: string): RouteProps => ({ path_tail, methods: ['PUT'] }), Route)

export type Delete = InstanceType<typeof Delete>
export const Delete = make_decorator('Delete', (path_tail?: string): RouteProps => ({ path_tail, methods: ['DELETE'] }), Route)

export type WS = InstanceType<typeof WS>
export const WS = make_decorator('WS', (path_tail?: string): RouteProps => ({ path_tail, methods: ['socket'] }), Route)

export type TpRouter = InstanceType<typeof TpRouter>
export const TpRouter = make_decorator('TpRouter', (path: `/${string}`, options?: TpRouterOptions) => ({ ...options, path, token: TpHttpToken }), TpEntry)

export type TpWebSocket = InstanceType<typeof TpWebSocket>
export const TpWebSocket = make_decorator('TpWebSocket', (path: `/${string}`, options?: TpWebSocketOptions) => ({ ...options, path, token: TpHttpToken }), TpEntry)
