/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Injector, TpService } from '@tarpit/core'
import { Connection } from 'amqplib'
import { takeUntil, tap } from 'rxjs'
import { RabbitConnector } from './rabbit-connector'
import { RabbitDefine, RabbitDefineToken } from './rabbit-define'
import { RabbitNotifier } from './rabbit-notifier'

@TpService({ inject_root: true })
export class RabbitClient {

    private definition = new RabbitDefine()

    constructor(
        private connector: RabbitConnector,
        private notifier: RabbitNotifier,
        private injector: Injector,
    ) {
        this.injector.provider_change$.pipe(
            tap(token => token === RabbitDefineToken && this.merge_definition()),
            takeUntil(this.injector.off$),
        ).subscribe()
        this.merge_definition()
    }

    async start() {
        let connection: Connection
        let error: any = undefined
        connection = await this.connector.connect().catch(err => {
            return error = err as any
        })
        if (error) {
            this.notifier.emit('error', { type: 'rabbitmq.connecting.failed', error: error })
            return
        }
        await this.assert_definition(connection).catch(err => {
            return error = err as any
        })
        if (error) {
            this.notifier.emit('error', { type: 'rabbitmq.assert.definition.failed', error: error })
            return
        }
        this.notifier.checkout$.next(connection)
        return
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
