/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { check_used, collect_provider } from '../__tools__/collector'
import { TpMeta } from '../__tools__/tp-meta'
import { MetaTools } from '../__tools__/tp-meta-tools'
import { Constructor } from '../__types__'
import { PluginSet } from '../builtin/plugin-set'
import { ClassProvider } from '../provider'
import { TpRootMeta, TpRootOptions } from '../tp-component-type'

/**
 * 把一个类标记为 Tp.TpRoot，并提供配置元数据。
 *
 * @category Root Annotation
 * @param options
 */
export function TpRoot(options?: TpRootOptions): ClassDecorator {
    return (constructor) => {
        const meta: TpMeta<TpRootMeta | undefined> = MetaTools.ComponentMeta(constructor.prototype) as any
        if (meta.exist() && meta.value.type) {
            throw new Error(`Component ${meta.value.type} is exist -> ${meta.value.name}.`)
        }
        meta.set({
            ...options,
            type: 'TpRoot',
            loader: 'œœ-TpRoot',
            category: 'module',
            name: constructor.name,
            provider_collector: collect_provider(constructor, options),
            on_load: (meta, injector) => {

                if (!injector.has(constructor)) {
                    const provider_tree = meta.provider_collector?.(injector)

                    injector.set_provider(constructor, new ClassProvider(constructor as any, injector))
                    meta.provider = injector.get(constructor as any)!
                    MetaTools.Instance(constructor).set(meta.provider.create())

                    const ps = injector.get(PluginSet)!.create()

                    Array.from(ps.plugins).forEach(plugin => {
                        const plugin_meta = MetaTools.PluginMeta(plugin.prototype).value!
                        const plugin_component_array: Constructor<any>[] = meta[plugin_meta.option_key as keyof TpRootMeta] as any
                        for (const component of plugin_component_array) {
                            const component_meta = MetaTools.ensure_component(component).value
                            if (component_meta.type !== plugin_meta.type) {
                                continue
                            }
                            if (component_meta.on_load) {
                                component_meta.on_load(component_meta as any, injector)
                            }
                        }
                    })

                    check_used(provider_tree, meta.name)
                }
            }
        })
    }
}
