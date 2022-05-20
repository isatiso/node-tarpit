/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */
import { collect_function, load_component, TpMeta, MetaTools } from '@tarpit/core'
import { ProducerFunction, TpProducerMeta, TpProducerOptions } from '../__types__'

export function TpProducer(options?: TpProducerOptions): ClassDecorator {
    return constructor => {

        const meta: TpMeta<TpProducerMeta | undefined> = MetaTools.ComponentMeta(constructor.prototype) as any
        if (meta.exist() && meta.value.type) {
            throw new Error(`Component ${meta.value.type} is exist -> ${meta.value.name}.`)
        }

        meta.set({
            type: 'TpProducer',
            loader: 'œœ-TpProducer',
            category: 'service',
            name: constructor.name,
            producer_options: options,
            function_collector: () => collect_function<ProducerFunction<any>>(constructor as any, 'TpProducerFunction'),
            on_load: (meta, injector) => load_component(constructor as any, injector, meta),
        })
    }
}
