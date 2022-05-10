/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { DecoratorClass, load_component, Meta, collect_function, TokenTools } from '@tarpit/core'
import { ProducerFunction, TpProducerMeta, TpProducerOptions } from '../__types__'

export function TpProducer(options?: TpProducerOptions): DecoratorClass {
    return constructor => {

        const meta: Meta<TpProducerMeta | undefined> = TokenTools.ComponentMeta(constructor.prototype) as any
        if (meta.exist() && meta.value.type) {
            throw new Error(`Component ${meta.value.type} is exist -> ${meta.value.name}.`)
        }

        meta.set({
            type: 'TpProducer',
            loader: 'œœ-TpProducer',
            category: 'service',
            name: constructor.name,
            producer_options: options,
            function_collector: () => collect_function<ProducerFunction<any>>(constructor, 'TpProducerFunction'),
            on_load: (meta, injector) => load_component(constructor, injector, meta),
        })
    }
}
