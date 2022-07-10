/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { make_decorator, TpEntry } from '@tarpit/core'
import { TpScheduleOptions } from '../__types__'

export const TpScheduleToken = Symbol.for('œœ.token.schedule.TpSchedule')
export type TpSchedule = InstanceType<typeof TpSchedule>
export const TpSchedule = make_decorator('TpSchedule', (options?: TpScheduleOptions) => ({ ...options, token: TpScheduleToken }), TpEntry)
