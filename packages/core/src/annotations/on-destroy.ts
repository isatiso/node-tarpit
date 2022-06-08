/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { make_decorator } from '../tools/tp-decorator'

export type OnDestroy = InstanceType<typeof OnDestroy>
export const OnDestroy = make_decorator('OnDestroy', () => ({}))
