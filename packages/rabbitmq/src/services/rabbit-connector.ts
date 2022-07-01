/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData } from '@tarpit/config'
import { Injector, TpService } from '@tarpit/core'
import { connect as connect_rabbitmq, Connection } from 'amqplib'
import { RabbitSessionCollector } from './rabbit-session-collector'

@TpService({ inject_root: true })
export class RabbitConnector {

    private readonly url = this.config.get('rabbitmq.url')
    private readonly socket_options = this.config.get('rabbitmq.socket_options')

    private closed = false

    constructor(
        private config: ConfigData,
        private sessions: RabbitSessionCollector,
        private injector: Injector,
    ) {
    }

    private _connection?: Connection
    get connection() {
        return this._connection
    }

    async close(): Promise<void> {
        this.closed = true
        await Promise.all(
            Array.from(this.sessions).map(ch => ch.channel?.waitForConfirms())
        )
        await this.connection?.close()
    }

    async connect(): Promise<Connection> {
        this._connection = undefined
        while (true) {
            const conn = await this._try_connect_server()
            if (typeof conn !== 'number') {
                this._connection = conn
                break
            } else if (conn > 48) {
                // TODO: 定义具体异常
                throw new Error('重试次数过多')
            } else {
                await this._sleep(2500)
            }
        }
        this.injector.emit('rabbitmq-connected', this._connection)
        return this._connection.on('close', () => !this.closed && this.connect())
    }

    private async _try_connect_server(count: number = 0): Promise<Connection | number> {
        return connect_rabbitmq(this.url, this.socket_options).catch(() => count + 1)
    }

    private async _sleep(ms: number) {
        return new Promise(resolve => setTimeout(() => resolve(undefined), ms))
    }
}
