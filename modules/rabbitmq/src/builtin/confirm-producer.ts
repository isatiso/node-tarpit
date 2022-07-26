/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Barbeque } from '@tarpit/barbeque'
import { Injector } from '@tarpit/core'
import { ConfirmChannel, Options, Replies } from 'amqplib'
import { narrow_to_buffer } from '../tools/narrow-to-buffer'
import { RabbitSession } from './rabbit-session'

export class ConfirmProducer<T extends string | object | Buffer> extends RabbitSession<ConfirmChannel> {

    private channel_drain = true
    private readonly _cache = new Barbeque<[content: Buffer, options: Options.Publish, callback: (err: any, ok: Replies.Empty) => void]>()
    private readonly _send: (content: Buffer, options: Options.Publish, callback: (err: any, ok: Replies.Empty) => void) => void

    constructor(
        target: string,
        routing_key: string | undefined,
        injector: Injector,
    ) {
        super(injector, true)
        this.on_channel_create(channel => {
            channel.on('drain', () => this._flush())
            this._flush()
        })

        if (routing_key !== undefined) {
            this._send = (content, options, callback) => this.channel_drain = this.channel!.publish(target, routing_key, content, options, callback)
        } else {
            this._send = (content, options, callback) => this.channel_drain = this.channel!.sendToQueue(target, content, options, callback)
        }
    }

    async send(message: T, options?: Options.Publish): Promise<void> {
        const buf = narrow_to_buffer(message)
        return new Promise((resolve, reject) => {
            options = options ?? {}
            if (!this.channel || !this.channel_drain) {
                this._cache.push([buf, options, err => err === null ? resolve() : reject(err)])
            } else {
                return this._send(buf, options, err => err === null ? resolve() : reject(err))
            }
        })
    }

    private _flush() {
        this.channel_drain = true
        while (this.channel && this.channel_drain && !this._cache.is_empty()) {
            const [content, options, callback] = this._cache.shift()!
            this._send(content, options, callback)
        }
    }
}
