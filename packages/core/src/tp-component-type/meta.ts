/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpAssemblyCommon, TpWorkerCommon } from './common'

export interface TpServiceMeta extends TpWorkerCommon<'TpService'> {
}

export interface TpModuleMeta extends TpAssemblyCommon<'TpModule'> {
}

export interface TpRootMeta extends TpAssemblyCommon<'TpRoot'> {
}
