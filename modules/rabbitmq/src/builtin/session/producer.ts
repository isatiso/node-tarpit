/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Barbeque } from '@tarpit/barbeque'
import { Injector } from '@tarpit/core'
import { Channel, Options } from 'amqplib'
import { narrow_to_buffer } from '../__tools__'
import { RabbitSession } from './rabbit-session'

export class Producer<T extends string | object | Buffer> extends RabbitSession<Channel> {

    private channel_drain = true
    private readonly _cache = new Barbeque<[content: Buffer, options: Options.Publish]>()
    private readonly _send: (content: Buffer, options: Options.Publish) => void

    constructor(
        target: string,
        routing_key: string | undefined,
        injector: Injector,
    ) {
        super(injector, false)
        this.on_channel_create(channel => {
            channel.on('drain', () => this._flush())
            this._flush()
        })
        if (routing_key !== undefined) {
            this._send = (content, options) => this.channel_drain = this.channel!.publish(target, routing_key, content, options)
        } else {
            this._send = (content, options) => this.channel_drain = this.channel!.sendToQueue(target, content, options)
        }
    }

    send(message: T, options?: Options.Publish): void {
        const buf = narrow_to_buffer(message)
        options = options ?? {}
        if (!this.channel || !this.channel_drain) {
            this._cache.push([buf, options])
        } else {
            this._send(buf, options)
        }
    }

    private _flush() {
        this.channel_drain = true
        while (this.channel && this.channel_drain && !this._cache.is_empty()) {
            const [content, options] = this._cache.shift()!
            this._send(content, options)
        }
    }
}
