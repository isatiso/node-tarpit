/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Injector } from '../di'
import { make_decorator } from '../tools/tp-decorator'

export interface TpPluginType {

    load(meta: any, injector: Injector): void

    start(): Promise<void>

    terminate(): Promise<void>
}

export type TpPlugin = InstanceType<typeof TpPlugin>
export const TpPlugin = make_decorator('TpPlugin', (options: { targets: symbol[] }) => ({ ...options }))
