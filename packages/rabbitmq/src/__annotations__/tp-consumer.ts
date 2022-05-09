/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DecoratorClass, load_component, make_provider_collector, Meta, set_touched, TokenTools } from '@tarpit/core'
import { ConsumerFunction, TpConsumerMeta, TpConsumerOptions } from '../__types__'

export function TpConsumer(options?: TpConsumerOptions): DecoratorClass {
    return constructor => {

        const meta: Meta<TpConsumerMeta | undefined> = TokenTools.ComponentMeta(constructor.prototype) as any
        if (meta.exist() && meta.value.type) {
            throw new Error(`Component ${meta.value.type} is exist -> ${meta.value.name}.`)
        }

        meta.set({
            type: 'TpConsumer',
            name: constructor.name,
            category: 'module',
            loader: '∑∫πœ-TpConsumer',
            consumer_options: options,
            provider_collector: make_provider_collector(constructor, options),
            on_load: (meta, injector) => load_component(constructor, injector, meta),
            function_collector: () => {
                const touched = set_touched(constructor).value
                return Object.values(touched)
                    .filter((item): item is ConsumerFunction<any> => item.type === 'TpConsumerFunction')
            }
        })
    }
}
