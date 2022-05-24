/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */
import { Constructor, MetaTools } from '@tarpit/core'
import { TpProducerMeta, TpProducerOptions } from '../__types__'

export function TpProducer(options?: TpProducerOptions): ClassDecorator {
    return constructor => {
        MetaTools.ComponentMeta(constructor.prototype)
            .if_exist(meta => {
                throw new Error(`Component ${meta.type} is exist -> ${meta.name}.`)
            })
            .set<TpProducerMeta>({
                type: 'TpProducer',
                name: constructor.name,
                loader: 'œœ-TpProducer',
                category: 'worker',
                self: constructor as unknown as Constructor<any>,
                producer_options: options,
            })
    }
}
