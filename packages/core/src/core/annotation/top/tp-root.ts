/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { _find_usage, make_provider_collector } from '../../collector'
import { ClassProvider } from '../../provider'
import { TokenUtils } from '../../token-utils'
import { DecoratorClass, TpRootOptions } from '../__types__'

/**
 * 把一个类标记为 Tp.TpRoot，并提供配置元数据。
 *
 * @category Root Annotation
 * @param options
 */
export function TpRoot(options?: TpRootOptions): DecoratorClass {
    return constructor => {
        const meta = TokenUtils.ComponentMeta(constructor.prototype)
        if (meta.exist() && meta.value.type) {
            throw new Error(`Component ${meta.value.type} is exist -> ${meta.value.name}.`)
        }
        meta.set({
            type: 'TpRoot',
            name: constructor.name,
            routers: options?.routers,
            tasks: options?.tasks,
            consumers: options?.consumers,
            producers: options?.producers,
            provider_collector: make_provider_collector(constructor, options),
            on_load: (meta, injector) => {

                if (!injector.has(constructor)) {
                    const provider_tree = meta.provider_collector?.(injector)

                    injector.set_provider(constructor, new ClassProvider(constructor, injector))
                    meta.provider = injector.get(constructor)!
                    TokenUtils.Instance(constructor).set(meta.provider.create())

                    meta.consumers?.map(m => TokenUtils.ensure_component(m, 'TpConsumer').value)
                        .forEach(meta => meta.on_load(meta, injector))
                    meta.routers?.map(m => TokenUtils.ensure_component(m, 'TpRouter').value)
                        .forEach(meta => meta.on_load(meta, injector))
                    meta.tasks?.map(m => TokenUtils.ensure_component(m, 'TpTrigger').value)
                        .forEach(meta => meta.on_load(meta, injector))

                    provider_tree?.children.filter(def => !_find_usage(def))
                        .forEach(def => {
                            console.log(`Warning: ${meta.name} -> ${def?.name} not used.`)
                        })
                }
            }
        })
    }
}
