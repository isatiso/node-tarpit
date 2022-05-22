/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ClassProviderDef, Constructor, FactoryProviderDef, ProviderDef, ValueProviderDef } from '../__types__'

export function isFactoryProvider<T extends object>(def: ProviderDef<T> | Constructor<any>): def is FactoryProviderDef {
    return !(def as any).prototype && (def as any).useFactory
}

export function isValueProvider<T extends object>(def: ProviderDef<T> | Constructor<any>): def is ValueProviderDef {
    return !(def as any).prototype && (def as any).useValue
}

export function isClassProvider<T extends object>(def: ProviderDef<T> | Constructor<any>): def is ClassProviderDef<T> {
    return !(def as any).prototype && (def as any).useClass
}
