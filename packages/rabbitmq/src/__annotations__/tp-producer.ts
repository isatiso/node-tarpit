/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */
import { Constructor, MetaTools, TpMeta } from '@tarpit/core'
import { TpProducerMeta, TpProducerOptions } from '../__types__'

export function TpProducer(options?: TpProducerOptions): ClassDecorator {
    return constructor => {

        const meta: TpMeta<TpProducerMeta | undefined> = MetaTools.ComponentMeta(constructor.prototype) as any
        if (meta.exist() && meta.value.type) {
            throw new Error(`Component ${meta.value.type} is exist -> ${meta.value.name}.`)
        }

        meta.set({
            type: 'TpProducer',
            name: constructor.name,
            loader: 'œœ-TpProducer',
            category: 'worker',
            self: constructor as unknown as Constructor<any>,
            producer_options: options,
        })
    }
}
