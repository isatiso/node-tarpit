/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Injector } from '../injector'
import { TpAssemblyCommon, TpWorkerCommon } from './common'

export interface TpServiceMeta extends TpWorkerCommon<'TpService'> {
    on_load: (meta: TpServiceMeta, injector: Injector) => void
}

export interface TpModuleMeta extends TpAssemblyCommon<'TpModule'> {
}

export interface TpRootMeta extends TpAssemblyCommon<'TpRoot'> {
    on_load: (meta: TpRootMeta, injector: Injector) => void
}
