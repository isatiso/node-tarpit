/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Constructor, MetaTools } from '@tarpit/core'
import { TpConsumerMeta, TpConsumerOptions } from '../__types__'

export function TpConsumer(options?: TpConsumerOptions): ClassDecorator {
    return constructor => {
        MetaTools.ComponentMeta(constructor.prototype)
            .if_exist(meta => {
                throw new Error(`Component ${meta.type} is exist -> ${meta.name}.`)
            })
            .set<TpConsumerMeta>({
                type: 'TpConsumer',
                loader: 'œœ-TpConsumer',
                category: 'assembly',
                name: constructor.name,
                self: constructor as unknown as Constructor<any>,
                imports: options?.imports ?? [],
                providers: options?.providers ?? [],
                consumer_options: options,
            })
    }
}
