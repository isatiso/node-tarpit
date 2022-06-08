/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ProxyConfig } from './__types__'

declare module '@tarpit/core' {

    // export interface TpRootOptions {
    //     routers?: Constructor<any>[]
    // }
    //
    // export interface TpAssemblyCollection {
    //     TpRouter: TpRouterMeta
    // }
    //
    // export interface TpUnitCollection {
    //     TpRouterUnit: TpRouterUnit<any>
    // }
    //
    // export interface TpPluginCollection {
    //     TpHttpServer: typeof TpHttpServer
    // }
}

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

export * from './annotations'
export * from './errors'
export * from './services'
export * from './__types__'
export * from './builtin'
export * from './tp-http-server'
