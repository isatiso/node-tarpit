/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { get_providers, Injector, TpService } from '@tarpit/core'
import { ConsumeMessage } from 'amqplib'
import { ConsumeUnit } from '../annotations/consume'
import { ChannelWrapper } from '../builtin/channel-wrapper'
import { Letter, PURE_LETTER } from '../builtin/letter'

@TpService({ inject_root: true })
export class RabbitmqConsumer {


    async create(injector: Injector, unit: ConsumeUnit): Promise<void> {
        const channel_wrapper = new ChannelWrapper(this)
        const provider_list = get_providers(unit, injector, new Set([Letter, PURE_LETTER]))

        const on_message = async function(msg: ConsumeMessage | null): Promise<void> {
            if (!msg) {
                throw new Error('Channel closed by server.')
            }
            const param_list = provider_list.map((provider: any) => {
                if (provider === undefined) {
                    return undefined
                } else if (provider === Letter) {
                    const content = JSON.parse(msg.content.toString('utf-8'))
                    return new Letter(content, msg.fields, msg.properties)
                } else if (provider === PURE_LETTER) {
                    return msg
                } else {
                    return provider.create()
                }
            })

            try {
                await unit.handler(...param_list)
                channel_wrapper.channel?.ack(msg)
            } catch (reason) {
                if (reason instanceof Ack) {
                    channel_wrapper.channel?.ack(msg)
                } else if (reason instanceof Requeue) {
                    channel_wrapper.channel?.reject(msg)
                } else if (reason instanceof Dead) {
                    channel_wrapper.channel?.reject(msg, false)
                } else {
                    channel_wrapper.channel?.reject(msg)
                }
            }
        }

        channel_wrapper.consume(unit.queue, msg => on_message(msg).catch(e => console.log('catch', e)), unit.options)
    }
}
