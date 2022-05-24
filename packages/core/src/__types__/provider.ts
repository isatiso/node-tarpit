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
    multi?: boolean
}

export interface FactoryProviderDef<T> {
    provide: any
    useFactory: () => T
    deps?: any[]
}

export interface Provider<T> {
    name: string
    used: boolean

    set_used(parents?: any[]): void

    create(...args: any[]): T
}

export interface ProviderTreeNode {
    name: string
    providers: (Provider<any> | undefined)[]
    children: (ProviderTreeNode | undefined)[]
}
