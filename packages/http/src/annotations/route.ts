/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { make_decorator } from '@tarpit/core'
import { ApiMethod } from '../__types__'
import { TpHttp } from './base'

export type RouteProps = { path_tail?: string, methods: ApiMethod[] }
export type Route = InstanceType<typeof Route>
export const Route = make_decorator('Route', (methods: ApiMethod[], path_tail?: string): RouteProps => ({ path_tail, methods }), TpHttp)
