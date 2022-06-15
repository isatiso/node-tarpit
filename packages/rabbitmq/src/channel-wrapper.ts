/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Barbeque } from '@tarpit/barbeque'
import { ConfirmChannel, Connection, ConsumeMessage, Options } from 'amqplib'
import { Replies } from 'amqplib/properties'
import { EventEmitter } from 'events'
import { ConsumeOptions } from './__types__'

type ConsumeArguments = [queue: string, on_message: (msg: ConsumeMessage | null) => void, options: ConsumeOptions]
type PublishArguments = [exchange: string, routingKey: string, content: Buffer, options: Options.Publish, callback: (err: any, ok: Replies.Empty) => void]

export class ChannelWrapper {

    public channel_error?: any
    public channel: ConfirmChannel | undefined
    private channel_drain?: boolean = true
    private channel_publish_queue: Barbeque<PublishArguments> = new Barbeque()
    private consumers: Map<ConsumeArguments, string | null> = new Map()

    constructor(
        private parent: { connection?: Connection, emitter: EventEmitter, channel_collector: Set<ChannelWrapper>, prefetch?: number }
    ) {
        parent.channel_collector.add(this)
        parent.emitter.on('reconnected', () => this.recreate_channel())
        this.recreate_channel()
    }

    recreate_channel() {
        this.consumers.forEach((_, key) => this.consumers.set(key, null))
        this.parent.connection?.createConfirmChannel().then(channel => {
            if (!channel) {
                return
            }
            this.channel = channel
            this.channel_drain = true
            channel.on('drain', () => {
                this.flush_publish()
            })
            channel.on('close', () => {
                this.channel = undefined
            })
            channel.on('error', err => {
                this.channel = undefined
                this.channel_error = err
                this.recreate_channel()
            })
            this.flush_publish()
            for (const args of this.consumers.keys()) {
                if (this.consumers.get(args)) {
                    continue
                }
                const { prefetch, ...other_options } = args[2]
                channel.prefetch(prefetch ?? this.parent.prefetch ?? 20).then()
                const consume_args: ConsumeArguments = [args[0], args[1], other_options]
                channel.consume(...consume_args).then(res => {
                    this.consumers.set(args, res.consumerTag)
                })
            }
        })

    }

    publish(exchange: string, routing_key: string, content: Buffer, options?: Options.Publish): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            options = options ?? {}
            this.pure_publish(exchange, routing_key, content, options, resolve, reject)
        })
    }

    pure_publish(exchange: string, routing_key: string, content: Buffer, options: Options.Publish, resolve: (data?: any) => void, reject: (err: any) => void): void {
        if (!this.channel || !this.channel_drain) {
            this.channel_publish_queue.push([exchange, routing_key, content, options, err => err === null ? resolve() : reject(err)])
        } else {
            this.channel_drain = this.channel.publish(exchange, routing_key, content, options, err => err === null ? resolve() : reject(err))
        }
    }

    consume(queue: string, on_message: (msg: ConsumeMessage | null) => void, options?: ConsumeOptions): void {
        const args: ConsumeArguments = [queue, on_message, options ?? {}]
        this.consumers.set(args, null)
        if (this.channel) {
            this.channel.consume(...args).then(res => this.consumers.set(args, res.consumerTag))
        }
    }

    private flush_publish() {
        this.channel_drain = true
        while (this.channel && this.channel_drain && !this.channel_publish_queue.is_empty()) {
            const args = this.channel_publish_queue.shift()!
            this.channel_drain = this.channel.publish(...args)
        }
    }
}
