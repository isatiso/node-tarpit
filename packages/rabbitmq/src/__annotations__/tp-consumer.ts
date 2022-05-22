/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Constructor, MetaTools, TpMeta } from '@tarpit/core'
import { TpConsumerMeta, TpConsumerOptions } from '../__types__'

export function TpConsumer(options?: TpConsumerOptions): ClassDecorator {
    return constructor => {

        const meta: TpMeta<TpConsumerMeta | undefined> = MetaTools.ComponentMeta(constructor.prototype) as any
        if (meta.exist() && meta.value.type) {
            throw new Error(`Component ${meta.value.type} is exist -> ${meta.value.name}.`)
        }

        meta.set({
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
