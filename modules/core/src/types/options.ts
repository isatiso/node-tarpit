/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */
import { Constructor } from './base'
import { ProviderDef } from './provider'

export type TpBaseOptions = { inject_root?: boolean }

export interface ImportsAndProviders {
    imports?: Array<Constructor<any>>
    providers?: (ProviderDef<any> | Constructor<any>)[]
}

export interface TpModuleOptions extends ImportsAndProviders, TpBaseOptions {
}

export interface TpServiceOptions extends TpBaseOptions {
    echo_dependencies?: boolean
}

export interface TpRootOptions extends ImportsAndProviders, TpBaseOptions {
    entries?: Constructor<any>[]
}
