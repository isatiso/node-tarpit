/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */
import { TpPluginConstructor } from '../__tools__/plugin-types'
import { TpService } from '../annotations'

@TpService()
export class PluginSet {
    plugins = new Set<TpPluginConstructor<any>>()
}
