/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { make_decorator } from '@tarpit/core'
import { TpHttp } from './base'

export type CacheUnder = InstanceType<typeof CacheUnder>
export const CacheUnder = make_decorator('CacheUnder', (scope: string, expire_secs?: number) => ({ scope, expire_secs: expire_secs ?? 0 }), TpHttp)
