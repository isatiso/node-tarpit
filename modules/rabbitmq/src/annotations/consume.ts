/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { make_decorator } from '@tarpit/core'
import { Options } from 'amqplib'

export type ConsumeOptions = Options.Consume & { prefetch?: number }
export type Consume = InstanceType<typeof Consume>
export const Consume = make_decorator('Consume', (queue: string, options?: ConsumeOptions) => ({ options, queue }))
