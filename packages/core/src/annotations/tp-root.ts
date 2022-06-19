/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { make_decorator } from '../tools/decorator'
import { TpRootOptions } from '../types'
import { TpEntry } from './tp-base'

export type TpRoot = InstanceType<typeof TpRoot>
export const TpRoot = make_decorator('TpRoot', (options?: TpRootOptions) => ({
    ...options,
    token: null as unknown as symbol
}), TpEntry)
