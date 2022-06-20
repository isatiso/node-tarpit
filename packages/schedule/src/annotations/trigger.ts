/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { make_decorator } from '@tarpit/core'
import { TriggerOptions } from '../__types__'

export type Trigger = InstanceType<typeof Trigger>
export const Trigger = make_decorator('Trigger', (crontab: string, name: string, options?: TriggerOptions) => ({ crontab, name, options }))
