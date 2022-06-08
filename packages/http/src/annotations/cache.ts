/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { make_decorator } from '@tarpit/core'
import { TpHttp } from './base'

export type Cache = InstanceType<typeof Cache>
export const Cache = make_decorator('Cache', (scope: string, expire_secs?: number) => ({ scope, expire_secs: expire_secs ?? 0 }), TpHttp)
