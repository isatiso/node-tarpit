/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ProxyConfig } from './__types__'
import { ResponseCacheControl } from './tools/cache-control'

declare module '@tarpit/config' {

    export interface TpConfigSchema {
        http: {
            port: number
            proxy?: ProxyConfig
            expose_error?: boolean
            static?: {
                root?: string,
                index?: string[],
                extensions?: `.${string}`[],
                cache_size?: number
                dotfile?: 'allow' | 'ignore' | 'deny'
                vary?: string[] | '*'
                cache_control?: ResponseCacheControl
            }
            server?: {
                keepalive_timeout?: number
                terminate_timeout?: number
            }
            cors?: {
                allow_origin: string
                allow_headers: string
                allow_methods: string
                max_age: number
            },
            body?: {
                max_length?: number
            },
        }
    }
}

export * from './__types__'
export * from './errors'

export {
    TpRouter,
    CacheUnder,
    Get,
    Delete,
    Put,
    Post,
    Auth,
    Route,
    TpWebSocket,
    RouteProps,
} from './annotations'

export { HttpAuthenticator } from './services/http-authenticator'
export { HttpCacheProxy } from './services/http-cache-proxy'
export { HttpHooks } from './services/http-hooks'
export { HttpInspector } from './services/http-inspector'
export { HttpBodyFormatter } from './services/http-body-formatter'
export { HttpStatic } from './services/http-static'
export {
    FormBody,
    JsonBody,
    RawBody,
    TextBody,
    MimeBody,
    Guard,
    HttpContext,
    Params,
    PathArgs,
    RequestHeaders,
    ResponseCache,
    TpRequest,
    TpResponse,
} from './builtin'
export { HttpServerModule } from './http-server.module'
