/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { make_decorator } from '../tools/tp-decorator'

export type MetaData = InstanceType<typeof MetaData>
export const MetaData = make_decorator('MetaData', (meta: any) => ({ meta }))
