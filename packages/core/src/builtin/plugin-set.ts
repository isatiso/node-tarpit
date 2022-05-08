/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { TpPluginConstructor } from '../__tools__/plugin-types'
import { TpService } from '../annotations'

@TpService()
export class PluginSet {
    plugins = new Set<TpPluginConstructor<any>>()
}
