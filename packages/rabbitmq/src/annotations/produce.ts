/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Barbeque } from '@tarpit/barbeque'
import { Constructor, make_decorator } from '@tarpit/core'
import { ProduceOptions } from '../__types__'
import { ChannelWrapper } from '../channel-wrapper'

export type ProduceUnit = {
    exchange: string
    routing_key: string
    produce_cache: Barbeque<[message: any, produce_options: ProduceOptions | undefined, resolve: (data: any) => void, reject: (err: any) => void]>
    channel_wrapper?: ChannelWrapper
    channel_error?: any
    options: ProduceOptions
    position: string
    handler: Function
    cls: Constructor<any>
    prop: string | symbol
}

export type Produce = InstanceType<typeof Produce>
export const Produce = make_decorator('Produce', (exchange: string, routing_key: string, options?: ProduceOptions) => ({ options, exchange, routing_key }))
