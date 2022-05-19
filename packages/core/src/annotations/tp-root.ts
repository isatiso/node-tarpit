/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { check_used, collect_provider } from '../__types__/__tools__/collector'
import { TpRootMeta, TpRootOptions } from '../__types__/__tools__/component-types'
import { Meta } from '../__types__/__tools__/meta'
import { MetaTools } from '../__types__/__tools__/meta-tools'
import { PluginSet } from '../builtin/plugin-set'
import { ClassProvider } from '../provider'
import { TokenTools } from '../__types__/__tools__/token-tools'
import { Constructor, DecoratorClass } from '../__types__'

/**
 * 把一个类标记为 Tp.TpRoot，并提供配置元数据。
 *
 * @category Root Annotation
 * @param options
 */
export function TpRoot(options?: TpRootOptions): DecoratorClass {
    return constructor => {
        const meta: Meta<TpRootMeta | undefined> = TokenTools.ComponentMeta(constructor.prototype) as any
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

                    injector.set_provider(constructor, new ClassProvider(constructor, injector))
                    meta.provider = injector.get(constructor)!
                    TokenTools.Instance(constructor).set(meta.provider.create())

                    const ps = injector.get(PluginSet)!.create()

                    Array.from(ps.plugins).forEach(plugin => {
                        const plugin_meta = MetaTools.PluginMeta(plugin.prototype).value!
                        const plugin_component_array: Constructor<any>[] = meta[plugin_meta.option_key as keyof TpRootMeta] as any
                        for (const component of plugin_component_array) {
                            const component_meta = TokenTools.ensure_component(component).value
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
