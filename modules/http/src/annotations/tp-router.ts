/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { make_decorator, TpEntry } from '@tarpit/core'
import { TpRouterOptions } from '../__types__'

export const TpRouterToken = Symbol.for('œœ.token.TpRouter')
export type TpRouter = InstanceType<typeof TpRouter>
export const TpRouter = make_decorator('TpRouter', (path: `/${string}`, options?: TpRouterOptions) => ({ ...options, path, token: TpRouterToken, }), TpEntry)
