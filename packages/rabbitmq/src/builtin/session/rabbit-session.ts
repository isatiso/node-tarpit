/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Injector } from '@tarpit/core'
import { ConfirmChannel, Connection } from 'amqplib'
import { EventEmitter } from 'events'

export class RabbitSession {

    public channel_error?: any
    public channel: ConfirmChannel | undefined
    private emitter = new EventEmitter()

    constructor(protected injector: Injector) {
        this.injector.on('rabbitmq-checked-out', conn => this.init(conn))
    }

    static create(injector: Injector) {
        return new RabbitSession(injector)
    }

    async init(connection: Connection): Promise<ConfirmChannel> {
        this.channel = await connection.createConfirmChannel()
        this.channel.on('close', () => this.channel = undefined)
        this.channel.on('error', err => {
            this.channel = undefined
            this.channel_error = err
            this.init(connection)
        })
        this.emitter.emit('channel-created', this.channel)
        return this.channel
    }

    on_create(callback: (channel: ConfirmChannel) => void) {
        this.emitter.on('channel-created', callback)
    }
}
