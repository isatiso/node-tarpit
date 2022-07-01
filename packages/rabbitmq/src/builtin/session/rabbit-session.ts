/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Injector } from '@tarpit/core'
import { ConfirmChannel, Connection } from 'amqplib'

export class RabbitSession {

    public channel_error?: any
    public channel: ConfirmChannel | undefined

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
        })
        return this.channel
    }
}
