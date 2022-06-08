/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { make_decorator } from '@tarpit/core'

export type Sherlock = InstanceType<typeof Sherlock>
export const Sherlock = make_decorator('Sherlock', (key: string, expire_secs?: number) => ({ key, expire_secs }))
