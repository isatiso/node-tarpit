/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Injector, TpConfigData } from '@tarpit/core'
import { Channel, ConsumeMessage } from 'amqplib'
import { ConsumeOptions } from '../annotations/consume'
import { RabbitSession } from './rabbit-session'

type ConsumeArguments = [queue: string, on_message: (msg: ConsumeMessage | null) => void, options: ConsumeOptions]

export class Consumer extends RabbitSession<Channel> {

    private config = this.injector.get(TpConfigData)!.create()
    private prefetch = this.config.get('rabbitmq.prefetch')
    private consumers: ConsumeArguments[] = []
    private consumer_tags = new Set<string>()

    constructor(injector: Injector) {
        super(injector, false)
        this.on_channel_create(channel => {
            channel.once('close', () => this.consumer_tags.clear())
            this.flush(channel).then()
        })
    }

    consume(queue: string, on_message: (msg: ConsumeMessage | null) => void, options: ConsumeOptions): void {
        const args: ConsumeArguments = [queue, on_message, options]
        this.consumers.push(args)
    }

    ack(msg: ConsumeMessage) {
        this.consumer_tags.has(msg.fields.consumerTag) && this.channel!.ack(msg)
    }

    requeue(msg: ConsumeMessage) {
        this.consumer_tags.has(msg.fields.consumerTag) && this.channel!.reject(msg)
    }

    kill(msg: ConsumeMessage) {
        this.consumer_tags.has(msg.fields.consumerTag) && this.channel!.reject(msg, false)
    }

    async flush(channel: Channel): Promise<void> {
        for (const args of this.consumers) {
            const { prefetch, ...other_options } = args[2]
            await channel.prefetch(prefetch ?? this.prefetch ?? 20)
            const res = await channel.consume(args[0], args[1], other_options)
            this.consumer_tags.add(res.consumerTag)
        }
    }
}
