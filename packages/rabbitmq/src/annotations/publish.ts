/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { make_decorator } from '@tarpit/core'
import { Options } from 'amqplib'

export type Publish = InstanceType<typeof Publish>
export const Publish = make_decorator('Publish', (exchange: string, routing_key: string, options?: Options.Publish) => ({ options, exchange, routing_key }))
