/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Constructor } from '@tarpit/core'
import { TpRouterMeta, TpRouterUnit } from './__types__'

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
export * from './__services__/authenticator'
export * from './__services__/cache-proxy'
export * from './__services__/life-cycle'
export * from './__services__/result-wrapper'
export * from './__tools__'
export * from './__types__'
export * from './api-params'
export * from './body-parser'
export * from './error'
export * from './handler'
export * from './session-context'
export * from './tp-http-server'
