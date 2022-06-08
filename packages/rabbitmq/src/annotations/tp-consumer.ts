/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { make_decorator, TpEntry } from '@tarpit/core'
import { TpConsumerOptions } from '../__types__'
import { ConsumeUnit } from './consume'

export const TpConsumerToken = Symbol.for('œœ.token.TpConsumer')
export type TpConsumer = InstanceType<typeof TpConsumer>
export const TpConsumer = make_decorator('TpConsumer', (options?: TpConsumerOptions) => ({ ...options, token: TpConsumerToken, units: [] as ConsumeUnit[] }), TpEntry)
