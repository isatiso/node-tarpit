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
            keepalive_timeout?: number
            proxy?: ProxyConfig
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
    TpRouterToken,
    Cache,
    Get,
    Delete,
    Put,
    Post,
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
export {
    AbstractAuthenticator,
    AbstractCacheProxy,
    AbstractErrorFormatter,
    AbstractHttpHooks,
    AbstractResponseFormatter,
    HttpInspector,
    TpAuthenticator,
    TpCacheProxy,
    TpErrorFormatter,
    TpHttpHooks,
    TpResponseFormatter,
} from './services'
export {
    ApiJudgement,
    FormBody,
    JsonBody,
    RawBody,
    TextBody,
    MimeBody,
    ContentTypeMedia,
    Guardian,
    HttpContext,
    HttpDict,
    Params,
    RequestHeader,
    ResponseCache,
    TpRequest,
    TpResponse,
} from './builtin'
export { HttpServerModule } from './http-server.module'
