/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { make_abstract_decorator, TpUnit } from '@tarpit/core'

export type TpHttp = InstanceType<typeof TpHttp>
export const TpHttp = make_abstract_decorator('TpHttp', TpUnit)
