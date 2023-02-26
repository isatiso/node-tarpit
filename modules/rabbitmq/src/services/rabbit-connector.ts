/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Injector, TpConfigData, TpService } from '@tarpit/core'
import { connect as connect_rabbitmq, Connection, Options } from 'amqplib'
import net from 'net'
import url from 'url'
import { RabbitRetryStrategy } from './rabbit-retry-strategy'
import { RabbitSessionCollector } from './rabbit-session-collector'

export function parse_amqp(value: string | { port?: number | string | null, hostname?: string | null }): [number, string] {
    if (typeof value === 'string') {
        value = url.parse(value)
    }
    return [
        +(value.port ?? 5672),
        value.hostname ?? 'localhost'
    ]
}

export function is_reachable(url: string | Options.Connect, timeout_ms: number) {
    const [port, hostname] = parse_amqp(url)
    return new Promise((resolve, reject) => {
        const socket = new net.Socket()
        socket.setTimeout(timeout_ms)
        socket.on('error', err => {
            socket.destroy()
            reject(err)
        })
        socket.on('timeout', () => {
            socket.destroy()
            reject(new Error(`connect ${url} exceed ${timeout_ms}ms`))
        })
        socket.connect(port, hostname, () => {
            socket.end()
            resolve(true)
        })
    })
}

@TpService({ inject_root: true })
export class RabbitConnector {

    private readonly url = this.config.get('rabbitmq.url')
    private readonly timeout = this.config.get('rabbitmq.timeout') ?? 1000
    private readonly socket_options = this.config.get('rabbitmq.socket_options')

    private closed = false

    constructor(
        private config: TpConfigData,
        private sessions: RabbitSessionCollector,
        private injector: Injector,
        private retry_strategy: RabbitRetryStrategy,
    ) {
    }

    private _connection?: Connection
    get connection() {
        return this._connection
    }

    async close(): Promise<void> {
        if (!this.closed) {
            this.closed = true
            await Promise.all(
                Array.from(this.sessions).map(ch => ch.channel?.waitForConfirms())
            )
            await this.connection?.close()
        }
    }

    async connect(): Promise<Connection> {
        if (this.closed) {
            throw new Error('connector is closed')
        }
        this._connection = undefined
        let count = 0
        do {
            try {
                this._connection = await this._try_connect_server()
                this.injector.emit('rabbitmq-connected', this._connection)
                return this._connection
            } catch (err) {
                await this.retry_strategy.on_failed(err).catch(err => {
                    this.closed = true
                    throw err
                })
                count++
            }
        } while (count < this.retry_strategy.max_retries)
        throw new Error('The number of retries exceeded the limit')
    }

    private async _try_connect_server(): Promise<Connection> {
        await is_reachable(this.url, this.timeout)
        const connection = await connect_rabbitmq(this.url, this.socket_options)
        return connection
            .on('close', () => this.connect())
            .on('error', (err: any) => {
                const code = err && err.code
                if (code !== 200 && code !== 320) {
                    this._connection = undefined
                    this.closed = true
                }
                this.injector.emit('error', { type: 'rabbitmq.connection.error', error: err })
            })
    }
}
