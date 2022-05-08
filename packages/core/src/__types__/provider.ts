/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Constructor } from './base'

export type ProviderDef<T extends object> = ValueProviderDef | ClassProviderDef<T> | FactoryProviderDef

export interface ValueProviderDef {
    provide: any
    useValue: any
}

export interface ClassProviderDef<T extends object> {
    provide: T
    useClass: Constructor<T>
    multi?: boolean
}

export interface FactoryProviderDef {
    provide: any
    useFactory: Function
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
