/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpDefaultUnit } from './common'
import { TpModuleMeta, TpRootMeta, TpServiceMeta } from './meta'

export interface TpAssemblyCollection {
    TpModule: TpModuleMeta
    TpRoot: TpRootMeta
}

export interface TpWorkerCollection {
    TpService: TpServiceMeta
}

export interface TpComponentCollection extends TpAssemblyCollection, TpWorkerCollection {
}

export interface TpUnitCollection {
    TpDefaultUnit: TpDefaultUnit<any>
}

export type TpAssemblyLike = TpAssemblyCollection[keyof TpAssemblyCollection]
export type TpWorkerLike = TpWorkerCollection[keyof TpWorkerCollection]
export type TpComponentLike = TpComponentCollection[keyof TpComponentCollection]
export type TpUnitLike = TpUnitCollection[keyof TpUnitCollection]
