/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpPlugin, TpService } from '../annotations'
import { Injector } from '../di'

@TpService()
export class TpPluginCenter {

    private _plugins: TpPlugin[] = []

    constructor(
        private injector: Injector
    ) {
    }

    add(value: TpPlugin): this {
        if (!this._plugins.includes(value)) {
            this._plugins.push(value)
        }
        return this
    }

    has(value: TpPlugin): boolean {
        return this._plugins.includes(value)
    }

    start(): Promise<any>[] {
        return this._plugins.map(plugin_meta => this.injector.get(plugin_meta.cls)?.create()?.start())
    }

    terminate(): Promise<any>[] {
        return this._plugins.map(plugin_meta => this.injector.get(plugin_meta.cls)?.create()?.terminate())
    }
}
