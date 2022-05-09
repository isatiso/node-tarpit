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
    category: string
}

export interface BaseTpModuleMeta<Type extends ComponentType> extends BaseTpComponentMeta<Type> {
    category: 'module'
    provider_collector: (injector: Injector) => ProviderTreeNode
}

export interface BaseTpServiceMeta<Type extends ComponentType> extends BaseTpComponentMeta<Type> {
    category: 'service'
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

export interface TpServiceMeta extends BaseTpServiceMeta<'TpService'> {
}

export interface TpModuleMeta extends BaseTpModuleMeta<'TpModule'> {
}

export interface TpModuleLikeCollector {
    TpModule: TpModuleMeta
    TpRoot: TpRootMeta
}

export interface TpServiceLikeCollector {
    TpService: TpServiceMeta
}

export interface TpComponentCollector extends TpModuleLikeCollector, TpServiceLikeCollector {
}

export interface TpRootMeta extends BaseTpModuleMeta<'TpRoot'> {
    on_load: (meta: TpRootMeta, injector: Injector) => void
}

export type TpModuleLikeMeta = TpModuleLikeCollector[keyof TpModuleLikeCollector]
export type TpServiceLikeMeta = TpServiceLikeCollector[keyof TpServiceLikeCollector]
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

export interface TpRootOptions extends ImportsAndProviders {

}
