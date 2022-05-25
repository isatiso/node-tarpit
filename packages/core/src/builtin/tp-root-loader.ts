/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_component } from '../__tools__/collector'
import { MetaTools } from '../__tools__/tp-meta-tools'
import { PluginSet, PluginSetToken } from '../__tools__/tp-plugin'
import { Constructor } from '../__types__'
import { Injector } from '../injector'
import { TpRootMeta } from '../tp-component-type'

export class TpRootLoader {

    load(meta: TpRootMeta, injector: Injector): void {
        const plugins = injector.get<PluginSet>(PluginSetToken)?.create()!
        Array.from(plugins).forEach(plugin => {
            const plugin_meta = MetaTools.PluginMeta(plugin.prototype).value!
            const plugin_component_array = (meta[plugin_meta.option_key as keyof TpRootMeta] ?? []) as Array<Constructor<any>>
            for (const component of plugin_component_array) {
                const component_meta = MetaTools.ensure_component(component).value
                if (component_meta.type !== plugin_meta.type) {
                    continue
                }
                load_component(component, injector)
            }
        })
    }
}
