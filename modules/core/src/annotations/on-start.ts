/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { make_decorator } from '../tools/decorator'

export type OnStart = InstanceType<typeof OnStart>
export const OnStart = make_decorator('OnStart', () => ({}))
