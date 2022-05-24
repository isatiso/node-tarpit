/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Constructor, PropertyMeta, Provider, ProviderDef } from '../__types__'
import { TpUnitLike } from './collection'

export type ComponentType = `Tp${string}`

export interface TpUnitCommon<T extends (...args: any) => any> {
    u_type: `Tp${string}Unit`
    u_desc: TypedPropertyDescriptor<T>
    u_handler: T
    u_meta?: PropertyMeta
    u_param_types?: Parameters<T>
    u_position?: string
    u_prop: string | symbol
    u_proto: any
}

export type TpUnitRecord<T extends TpUnitLike = TpUnitLike> = Map<string | symbol, TpUnitLike>

export interface TpDefaultUnit<T extends (...args: any) => any> extends TpUnitCommon<T> {
    tp_type: 'TpDefaultUnit'
}

export interface TpComponentCommon<Type extends ComponentType> {
    type: Type
    name: string
    provider?: Provider<any>
    self: Constructor<any>
    loader: `œœ-${Type}`
    category: string
}

export interface TpAssemblyCommon<Type extends ComponentType> extends TpComponentCommon<Type> {
    category: 'assembly'
    imports: Constructor<any>[]
    providers: (ProviderDef<any> | Constructor<any>)[]
}

export interface TpWorkerCommon<Type extends ComponentType> extends TpComponentCommon<Type> {
    category: 'worker'
}

export interface ImportsAndProviders {
    imports?: Array<Constructor<any>>
    providers?: (ProviderDef<any> | Constructor<any>)[]
}
