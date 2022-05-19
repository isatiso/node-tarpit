/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { collect_function, collect_provider, load_component, Meta, TokenTools } from '@tarpit/core'
import { ConsumerFunction, TpConsumerMeta, TpConsumerOptions } from '../__types__'

export function TpConsumer(options?: TpConsumerOptions): ClassDecorator {
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
            function_collector: () => collect_function<ConsumerFunction<any>>(constructor as any, 'TpConsumerFunction'),
            on_load: (meta, injector) => load_component(constructor as any, injector, meta),
        })
    }
}
