/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpConfigData, TpService } from '@tarpit/core'
import { connect as connect_rabbitmq, Connection, Options } from 'amqplib'
import net from 'net'
import url from 'url'
import { RabbitNotifier } from './rabbit-notifier'
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

    private _closed = false
    get closed(): boolean {
        return this._closed
    }

    private _connection?: Connection

    get connection() {
        return this._connection
    }

    constructor(
        private config: TpConfigData,
        private sessions: RabbitSessionCollector,
        private notifier: RabbitNotifier,
        private retry_strategy: RabbitRetryStrategy,
    ) {
    }

    async close(): Promise<void> {
        if (!this._closed) {
            this._closed = true
            await Promise.all(
                Array.from(this.sessions).map(ch => ch.channel?.waitForConfirms())
            )
            this.connection?.removeAllListeners()
            await this.connection?.close()
        }
    }

    async connect(): Promise<Connection> {
        if (this._closed) {
            throw new Error('connector is closed')
        }
        this._connection = undefined
        let count = 0
        do {
            try {
                this._connection = await this._try_connect_server()
                this.notifier.connected$.next(this._connection)
                return this._connection
            } catch (err) {
                await this.retry_strategy.on_failed(err).catch(err => {
                    this._closed = true
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
            .on('close', () => {
                console.log('rabbitmq connection closed', this._closed)
                if (!this._closed) {
                    this.connect()
                }
            })
            .on('error', (err: any) => {
                console.log('rabbitmq connection error', err)
                const code = err && err.code
                if (code !== 200 && code !== 320) {
                    this._connection = undefined
                    this._closed = true
                }
                this.notifier.emit('error', { type: 'rabbitmq.connection.error', error: err })
            })
    }
}
