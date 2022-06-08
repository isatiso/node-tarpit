/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { make_decorator } from '../tools/tp-decorator'
import { TpRootOptions } from '../types'
import { TpEntry } from './tp-base'

export const TpRootToken = Symbol.for('œœ.token.TpRoot')
export type TpRoot = InstanceType<typeof TpRoot>
export const TpRoot = make_decorator('TpRoot', (options?: TpRootOptions) => ({
    ...options,
    token: TpRootToken
}), TpEntry)
