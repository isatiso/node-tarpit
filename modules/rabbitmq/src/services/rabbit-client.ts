/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData } from '@tarpit/config'
import { Injector, TpService } from '@tarpit/core'
import { Connection } from 'amqplib'
import { RabbitConnector } from './rabbit-connector'
import { RabbitDefine, RabbitDefineToken } from './rabbit-define'

@TpService({ inject_root: true })
export class RabbitClient {

    private definition = new RabbitDefine()

    constructor(
        private config_data: ConfigData,
        private connector: RabbitConnector,
        private injector: Injector,
    ) {
        this.merge_definition()
        this.injector.on('provider-change', token => {
            if (token === RabbitDefineToken) {
                this.merge_definition()
            }
        })
    }

    async start() {
        let connection: Connection
        let error: any = undefined
        connection = await this.connector.connect().catch(err => {
            return error = err as any
        })
        if (error) {
            this.emit('error', { type: 'rabbitmq.connecting.failed', error: error })
            return
        }
        await this.assert_definition(connection).catch(err => {
            return error = err as any
        })
        if (error) {
            this.injector.emit('error', { type: 'rabbitmq.assert.definition.failed', error: error })
            return
        }
        this.injector.emit('rabbitmq-checked-out', connection)
        return
    }

    private emit(event: any, data: any) {
        this.injector.emit(event, data)
    }

    async terminate() {
        return this.connector.close()
    }

    private merge_definition() {
        const definitions = this.injector.get<RabbitDefine[]>(RabbitDefineToken)!.create()
        this.definition = definitions.reduce((origin, next) => origin.merge(next), this.definition)
    }

    private async assert_definition(connection: Connection) {
        const channel = await connection.createChannel()
        for (const assertion of this.definition.exchange_defines) {
            await channel.assertExchange(...assertion)
        }
        for (const assertion of this.definition.queue_defines) {
            await channel.assertQueue(...assertion)
        }
        for (const binding of this.definition.exchange_bindings) {
            await channel.bindExchange(...binding)
        }
        for (const binding of this.definition.queue_bindings) {
            await channel.bindQueue(...binding)
        }
        await channel.close()
        return connection
    }
}
