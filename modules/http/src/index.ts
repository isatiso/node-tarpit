/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ProxyConfig } from './__types__'

declare module '@tarpit/config' {

    export interface TpConfigSchema {
        http: {
            port: number
            proxy?: ProxyConfig
            expose_error?: boolean
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
            }
        }
    }
}

export * from './__types__'
export {
    TpRouter,
    CacheUnder,
    Get,
    Delete,
    Put,
    Post,
    Auth,
    Route,
    RouteProps,
} from './annotations'
export {
    BusinessError,
    CrashError,
    StandardError,
    TpHttpError,
    TpHttpErrorDescription,
    TpHttpErrorHeader,
    throw_standard_error,
    throw_unauthorized
} from './errors'
export { HttpAuthenticator } from './services/http-authenticator'
export { HttpCacheProxy } from './services/http-cache-proxy'
export { HttpErrorFormatter } from './services/http-error-formatter'
export { HttpHooks } from './services/http-hooks'
export { HttpInspector } from './services/http-inspector'
export { HttpResponseFormatter } from './services/http-response-formatter'
export {
    FormBody,
    JsonBody,
    RawBody,
    TextBody,
    MimeBody,
    Guard,
    HttpContext,
    Params,
    RequestHeaders,
    ResponseCache,
    TpRequest,
    TpResponse,
    MergeCredentials,
} from './builtin'
export { HttpServerModule } from './http-server.module'
