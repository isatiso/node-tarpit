/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { make_decorator } from '@tarpit/core'
import { TaskOptions } from '../__types__'

export type Task = InstanceType<typeof Task>
export const Task = make_decorator('Task', (crontab: string, name: string, options?: TaskOptions) => ({ crontab, name, options }))
