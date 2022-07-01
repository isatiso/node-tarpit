/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData } from '@tarpit/config'
import { Injector } from '@tarpit/core'
import { ConfirmChannel, ConsumeMessage } from 'amqplib'
import { ConsumeOptions } from '../../annotations/consume'
import { RabbitSession } from './rabbit-session'

type ConsumeArguments = [queue: string, on_message: (msg: ConsumeMessage | null) => void, options: ConsumeOptions, consumer_tag?: string]

export class RabbitConsumeSession extends RabbitSession {

    private config = this.injector.get(ConfigData)!.create()
    private prefetch = this.config.get('rabbitmq.prefetch')
    private consumers: ConsumeArguments[] = []

    constructor(injector: Injector) {
        super(injector)
        this.on_create((channel) => this.flush(channel))
    }

    static create(injector: Injector) {
        return new RabbitConsumeSession(injector)
    }

    consume(queue: string, on_message: (msg: ConsumeMessage | null) => void, options?: ConsumeOptions): void {
        const args: ConsumeArguments = [queue, on_message, options ?? {}, undefined]
        this.consumers.push(args)
        if (this.channel) {
            this.channel.consume(args[0], args[1], args[2]).then(res => args[3] = res.consumerTag)
        }
    }

    ack(msg: ConsumeMessage) {
        this.channel?.ack(msg)
    }

    requeue(msg: ConsumeMessage) {
        this.channel?.reject(msg)
    }

    kill(msg: ConsumeMessage) {
        this.channel?.reject(msg, false)
    }

    async flush(channel: ConfirmChannel) {
        for (const args of this.consumers) {
            args[3] = undefined
            const { prefetch, ...other_options } = args[2]
            await channel.prefetch(prefetch ?? this.prefetch ?? 20)
            const res = await channel.consume(args[0], args[1], other_options)
            args[3] = res.consumerTag
        }
    }
}
