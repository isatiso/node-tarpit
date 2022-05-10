/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DecoratorClass, load_component, collect_provider, Meta, collect_function, TokenTools } from '@tarpit/core'
import { ConsumerFunction, TpConsumerMeta, TpConsumerOptions } from '../__types__'

export function TpConsumer(options?: TpConsumerOptions): DecoratorClass {
    return constructor => {

        const meta: Meta<TpConsumerMeta | undefined> = TokenTools.ComponentMeta(constructor.prototype) as any
        if (meta.exist() && meta.value.type) {
            throw new Error(`Component ${meta.value.type} is exist -> ${meta.value.name}.`)
        }

        meta.set({
            type: 'TpConsumer',
            loader: 'œœ-TpConsumer',
            category: 'module',
            name: constructor.name,
            consumer_options: options,
            provider_collector: collect_provider(constructor, options),
            function_collector: () => collect_function<ConsumerFunction<any>>(constructor, 'TpConsumerFunction'),
            on_load: (meta, injector) => load_component(constructor, injector, meta),
        })
    }
}
