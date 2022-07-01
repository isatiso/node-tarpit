/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Barbeque } from '@tarpit/barbeque'
import { Injector } from '@tarpit/core'
import { Connection, Options } from 'amqplib'
import { Replies } from 'amqplib/properties'
import { RabbitSession } from './rabbit-session'

type PublishArguments = [target: string, routingKey: string | undefined, content: Buffer, options: Options.Publish, callback: (err: any, ok: Replies.Empty) => void]

export class RabbitProduceSession extends RabbitSession {

    private channel_drain = true
    private _cache: Barbeque<PublishArguments> = new Barbeque()

    static create(injector: Injector) {
        return new RabbitProduceSession(injector)
    }

    async init(connection: Connection) {
        this.channel_drain = true
        const channel = await super.init(connection)
        channel.on('drain', () => this._flush())
        this._flush()
        return channel
    }

    send(exchange: string, routing_key: string | undefined, content: Buffer, options?: Options.Publish): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            options = options ?? {}
            this._send(exchange, routing_key, content, options, resolve, reject)
        })
    }

    private _send(target: string, routing_key: string | undefined, content: Buffer, options: Options.Publish, resolve: (data?: any) => void, reject: (err: any) => void): void {
        if (!this.channel || !this.channel_drain) {
            this._cache.push([target, routing_key, content, options, err => err === null ? resolve() : reject(err)])
        } else if (routing_key !== undefined) {
            this.channel_drain = this.channel.publish(target, routing_key, content, options, err => err === null ? resolve() : reject(err))
        } else {
            this.channel_drain = this.channel.sendToQueue(target, content, options, err => err === null ? resolve() : reject(err))
        }
    }

    private _flush() {
        this.channel_drain = true
        while (this.channel && this.channel_drain && !this._cache.is_empty()) {
            const [target, routing_key, content, options, callback] = this._cache.shift()!
            if (routing_key !== undefined) {
                this.channel_drain = this.channel.publish(target, routing_key, content, options, callback)
            } else {
                this.channel_drain = this.channel.sendToQueue(target, content, options, callback)
            }
        }
    }
}
