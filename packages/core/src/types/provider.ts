/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Constructor } from './base'

export type ProviderDef<T extends object> = ValueProviderDef<T> | ClassProviderDef<T> | FactoryProviderDef<T>

export interface ValueProviderDef<T> {
    provide: any
    useValue: T
}

export interface ClassProviderDef<T extends object> {
    provide: T
    useClass: Constructor<T>
}

export interface FactoryProviderDef<T> {
    provide: any
    useFactory: (...args: any[]) => T
    deps?: any[]
}

export interface Provider<T> {
    used: boolean

    set_used(parents?: any[]): this

    create(...args: any[]): T
}

export interface ProviderTreeNode {
    self: Constructor<any>
    providers?: (Provider<any>)[]
    children?: (ProviderTreeNode | undefined)[]
}

export type ParentDesc = { token: any, index?: number }
