/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { make_decorator } from '@tarpit/core'
import { Route, RouteProps } from './route'

export type Delete = InstanceType<typeof Delete>
export const Delete = make_decorator('Delete', (path_tail?: string): RouteProps => ({ path_tail, methods: ['DELETE'] }), Route)
