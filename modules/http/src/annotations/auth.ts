/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { make_decorator } from '@tarpit/core'
import { TpHttp } from './base'

export type Auth = InstanceType<typeof Auth>
export const Auth = make_decorator('Auth', () => ({}), TpHttp)
