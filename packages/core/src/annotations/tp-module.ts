/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { make_decorator } from '../tools/tp-decorator'
import { TpModuleOptions } from '../types'
import { TpAssembly } from './tp-base'

export const TpModuleToken = Symbol.for('œœ.token.TpModule')
export type TpModule = InstanceType<typeof TpModule>
export const TpModule = make_decorator('TpModule', (options?: TpModuleOptions) => ({
    ...options,
    token: TpModuleToken,
}), TpAssembly)
