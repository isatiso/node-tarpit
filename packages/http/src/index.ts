/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Constructor } from '@tarpit/core'
import { TpRouterMeta, TpRouterUnit } from './__types__'
import { TpHttpServer } from './tp-http-server'

declare module '@tarpit/core' {

    export interface TpRootOptions {
        routers?: Constructor<any>[]
    }

    export interface TpAssemblyCollection {
        TpRouter: TpRouterMeta
    }

    export interface TpUnitCollection {
        TpRouterUnit: TpRouterUnit<any>
    }

    export interface TpPluginCollection {
        TpHttpServer: typeof TpHttpServer
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

export * from './__annotations__'
export * from './__services__/abstract-authenticator'
export * from './__services__/abstract-cache-proxy'
export * from './__services__/abstract-life-cycle'
export * from './__services__/abstract-result-wrapper'
export * from './__tools__'
export * from './__types__'
export * from './builtin/api-params'
export * from './builtin/body-parser'
export * from './error'
export * from './handler'
export * from './builtin/session-context'
export * from './tp-http-server'
