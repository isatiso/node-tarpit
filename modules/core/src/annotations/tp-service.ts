/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { make_decorator } from '../tools/decorator'
import { TpServiceOptions } from '../types'
import { TpWorker } from './tp-base'

export type TpService = InstanceType<typeof TpService>
export const TpService = make_decorator('TpService', (options?: TpServiceOptions) => ({
    ...options,
    token: null as any
}), TpWorker)
