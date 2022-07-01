/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData } from '@tarpit/config'
import { Injector, Optional, TpService } from '@tarpit/core'
import { Connection } from 'amqplib'
import { RabbitConnector } from './rabbit-connector'
import { RabbitConsumer } from './rabbit-consumer'
import { RabbitDefine } from './rabbit-define'
import { RabbitProducer } from './rabbit-producer'

@TpService({ inject_root: true })
export class RabbitClient {

    constructor(
        private config_data: ConfigData,
        private connector: RabbitConnector,
        private consumers: RabbitConsumer,
        private injector: Injector,
        private producers: RabbitProducer,
        @Optional() private definition?: RabbitDefine,
    ) {
    }

    async terminate() {
        return this.connector.close()
    }

    async start() {
        this.injector.on('rabbitmq-connected', (conn: Connection) => {
            this.assert_definition(conn).then(conn => this.injector.emit('rabbitmq-checked-out', conn))
        })

        await this.connector.connect()
    }

    private async assert_definition(connection: Connection) {
        if (this.definition) {
            const channel = await connection.createChannel()
            for (const assertion of this.definition.exchanges) {
                await channel.assertExchange(...assertion)
            }
            for (const assertion of this.definition.queues) {
                await channel.assertQueue(...assertion)
            }
            for (const binding of this.definition.exchange_bindings) {
                await channel.bindExchange(...binding)
            }
            for (const binding of this.definition.queue_bindings) {
                await channel.bindQueue(...binding)
            }
            await channel.close()
        }
        return connection
    }
}
