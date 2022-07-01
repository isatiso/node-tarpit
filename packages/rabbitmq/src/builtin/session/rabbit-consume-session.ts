/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData } from '@tarpit/config'
import { Injector } from '@tarpit/core'
import { Connection, ConsumeMessage } from 'amqplib'
import { ConsumeOptions } from '../../annotations/consume'
import { RabbitSession } from './rabbit-session'

type ConsumeArguments = [queue: string, on_message: (msg: ConsumeMessage | null) => void, options: ConsumeOptions]

export class RabbitConsumeSession extends RabbitSession {

    private consumers: Map<ConsumeArguments, string | null> = new Map()
    private config = this.injector.get(ConfigData)!.create()
    private prefetch = this.config.get('rabbitmq.prefetch')

    static create(injector: Injector) {
        return new RabbitConsumeSession(injector)
    }

    override async init(connection: Connection) {
        const channel = await super.init(connection)

        this.consumers.forEach((_, key) => this.consumers.set(key, null))

        for (const args of this.consumers.keys()) {
            if (this.consumers.get(args)) {
                continue
            }
            const { prefetch, ...other_options } = args[2]
            await channel.prefetch(prefetch ?? this.prefetch ?? 20)
            const consume_args: ConsumeArguments = [args[0], args[1], other_options]
            const res = await channel.consume(...consume_args)
            this.consumers.set(args, res.consumerTag)
        }
        return channel
    }

    consume(queue: string, on_message: (msg: ConsumeMessage | null) => void, options?: ConsumeOptions): void {
        const args: ConsumeArguments = [queue, on_message, options ?? {}]
        this.consumers.set(args, null)
        if (this.channel) {
            this.channel.consume(...args).then(res => this.consumers.set(args, res.consumerTag))
        }
    }
}
