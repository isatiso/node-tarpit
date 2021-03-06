/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ImportsAndProviders, make_decorator, TpEntry } from '@tarpit/core'
import { TpRabbitmqToken } from './__token__'

export interface TpProducerOptions extends ImportsAndProviders {
}

export type TpProducer = InstanceType<typeof TpProducer>
export const TpProducer = make_decorator('TpProducer', (options?: TpProducerOptions) => ({ ...options, token: TpRabbitmqToken }), TpEntry)
