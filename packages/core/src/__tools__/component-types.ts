/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Constructor, PropertyMeta, Provider, ProviderDef, ProviderTreeNode } from '../__types__'
import { Injector } from '../injector'

export type ComponentType = `Tp${string}`

export interface BaseTpComponentMeta<Type extends ComponentType> {
    type: Type
    name: string
    provider?: Provider<any>
    loader: `∑∫πœ-${Type}`
    on_load?: (meta: any, injector: Injector) => void
}

export interface BaseTpModuleMeta<Type extends ComponentType> extends BaseTpComponentMeta<Type> {
    provider_collector: (injector: Injector) => ProviderTreeNode
}

export interface BasePropertyFunction<T extends (...args: any) => any> {
    type: `Tp${string}Function`
    prototype: any
    property: string
    descriptor: TypedPropertyDescriptor<T>
    handler: T
    param_types?: Parameters<T>
    pos?: string
    meta?: PropertyMeta
}

export interface TpServiceMeta extends BaseTpComponentMeta<'TpService'> {
    type: 'TpService'
}

export interface TpModuleMeta extends BaseTpModuleMeta<'TpModule'> {
    type: 'TpModule'
}

export interface TpModuleLikeCollector {
    TpModule: TpModuleMeta
}

export interface TpComponentCollector extends TpModuleLikeCollector {
    TpService: TpServiceMeta
}

export type TpModuleLikeMeta = TpModuleLikeCollector[keyof TpModuleLikeCollector]
export type TpComponentMeta = TpComponentCollector[keyof TpComponentCollector]

export interface ImportsAndProviders {
    imports?: Array<Constructor<any>>
    providers?: (ProviderDef<any> | Constructor<any>)[]
}

export interface TpModuleOptions extends ImportsAndProviders {
}

export interface TpServiceOptions {
    echo_dependencies?: boolean
}
