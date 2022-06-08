/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { make_decorator } from '@tarpit/core'
import { Route, RouteProps } from './route'

export type Get = InstanceType<typeof Get>
export const Get = make_decorator('Get', (path_tail?: string): RouteProps => ({ path_tail, methods: ['GET'] }), Route)
