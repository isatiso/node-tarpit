/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { make_decorator, TpEntry } from '@tarpit/core'
import { TpProducerOptions } from '../__types__'
import { ProduceUnit } from './produce'

export const TpProducerToken = Symbol.for('œœ.token.TpProducer')
export type TpProducer = InstanceType<typeof TpProducer>
export const TpProducer = make_decorator('TpProducer', (options?: TpProducerOptions) => ({ ...options, token: TpProducerToken, units: [] as ProduceUnit[] }), TpEntry)
