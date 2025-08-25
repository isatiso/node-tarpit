/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Injector } from '@tarpit/core'
import { Channel, ConfirmChannel, Connection } from 'amqplib'
import { switchMap, takeUntil } from 'rxjs'
import { RabbitConnector } from '../services/rabbit-connector.ts'
import { RabbitNotifier } from '../services/rabbit-notifier'

export class RabbitSession<CH extends Channel | ConfirmChannel> {

    public channel: CH | undefined
    protected notifier: RabbitNotifier
    protected connector: RabbitConnector
    private _on_channel_create?: (channel: CH) => void

    constructor(
        protected injector: Injector,
        private confirm?: boolean
    ) {
        this.notifier = this.injector.get(RabbitNotifier)!.create()
        this.connector = this.injector.get(RabbitConnector)!.create()
        this.notifier.checkout$.pipe(
            switchMap(async conn => await this.init(conn)),
            takeUntil(this.notifier.off$),
        ).subscribe()
    }

    async init(connection: Connection): Promise<CH | undefined> {
        this.channel = undefined
        try {
            this.channel = this.confirm
                ? await connection.createConfirmChannel() as CH
                : await connection.createChannel() as CH
        } catch (e: any) {
            this.notifier.channel_error$.next(e)
            return
        }
        this.channel.once('close', () => this.connector.closed || this.init(connection))
        this.channel.once('error', err => this.notifier.channel_error$.next(err))
        this._on_channel_create?.(this.channel)
        return this.channel
    }

    on_channel_create(callback: (channel: Channel) => void) {
        this._on_channel_create = callback
    }
}
