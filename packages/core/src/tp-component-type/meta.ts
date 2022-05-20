/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Injector } from '../injector'
import { TpModuleMetaCommon, TpServiceMetaCommon } from './common'

export interface TpServiceMeta extends TpServiceMetaCommon<'TpService'> {
    on_load: (meta: TpServiceMeta, injector: Injector) => void
}

export interface TpModuleMeta extends TpModuleMetaCommon<'TpModule'> {
}

export interface TpRootMeta extends TpModuleMetaCommon<'TpRoot'> {
    on_load: (meta: TpRootMeta, injector: Injector) => void
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

export type TpModuleLikeMeta = TpModuleLikeCollector[keyof TpModuleLikeCollector]
export type TpServiceLikeMeta = TpServiceLikeCollector[keyof TpServiceLikeCollector]
export type TpComponentMeta = TpComponentCollector[keyof TpComponentCollector]
