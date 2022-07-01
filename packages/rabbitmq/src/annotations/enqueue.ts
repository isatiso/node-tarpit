/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { make_decorator } from '@tarpit/core'
import { Options } from 'amqplib'

export type Enqueue = InstanceType<typeof Enqueue>
export const Enqueue = make_decorator('Enqueue', (queue: string, options?: Options.Publish) => ({ options, queue }))
