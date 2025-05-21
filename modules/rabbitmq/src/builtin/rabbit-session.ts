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
import { RabbitNotifier } from '../services/rabbit-notifier'

export class RabbitSession<CH extends Channel | ConfirmChannel> {

    public channel: CH | undefined
    protected notifier = this.injector.get(RabbitNotifier)!.create()
    private _on_channel_create?: (channel: CH) => void

    constructor(protected injector: Injector, private confirm?: boolean) {
        this.notifier.checkout$.pipe(
            switchMap(async conn => await this.init(conn)),
            takeUntil(this.notifier.off$),
        ).subscribe()
    }

    async init(connection: Connection): Promise<CH> {
        this.channel = undefined
        this.channel = this.confirm
            ? await connection.createConfirmChannel() as CH
            : await connection.createChannel() as CH
        this.channel.once('close', () => this.init(connection))
        this.channel.once('error', err => this.notifier.channel_error$.next(err))
        this._on_channel_create?.(this.channel)
        return this.channel
    }

    on_channel_create(callback: (channel: Channel) => void) {
        this._on_channel_create = callback
    }
}
