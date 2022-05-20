/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { PropertyMeta, Provider, ProviderTreeNode } from '../__types__'
import { Injector } from '../injector'

export type ComponentType = `Tp${string}`

export interface TpWorkerCommon<T extends (...args: any) => any> {
    type: `Tp${string}Function`
    prototype: any
    property: string | symbol
    descriptor: TypedPropertyDescriptor<T>
    handler: T
    param_types?: Parameters<T>
    pos?: string
    meta?: PropertyMeta
}

export type TpWorkerRecord = Record<string | symbol, TpWorkerCommon<any>>

export interface TpComponentMetaCommon<Type extends ComponentType> {
    type: Type
    name: string
    provider?: Provider<any>
    loader: `œœ-${Type}`
    on_load?: (meta: any, injector: Injector) => void
    category: string
}

export interface TpModuleMetaCommon<Type extends ComponentType> extends TpComponentMetaCommon<Type> {
    category: 'module'
    provider_collector: (injector: Injector) => ProviderTreeNode
}

export interface TpServiceMetaCommon<Type extends ComponentType> extends TpComponentMetaCommon<Type> {
    category: 'service'
}
