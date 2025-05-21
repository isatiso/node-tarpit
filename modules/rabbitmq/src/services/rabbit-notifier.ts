/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Injector, TpService } from '@tarpit/core'
import { Connection } from 'amqplib'
import { EventEmitter } from 'events'
import { Subject, take } from 'rxjs'

@TpService({ inject_root: true })
export class RabbitNotifier {

    readonly off$ = this.injector.off$.pipe()
    readonly checkout$ = new Subject<Connection>()
    readonly connected$ = new Subject<Connection>()
    readonly channel_error$ = new Subject<any>()

    private _emitter = new EventEmitter()

    constructor(
        private injector: Injector,
    ) {
        this.injector.off$.pipe(take(1)).subscribe(() => this._emitter.removeAllListeners())
    }

    on(event_name: string | symbol, listener: (...args: any[]) => void): this {
        this._emitter.on(event_name, listener)
        return this
    }

    emit(event_name: string | symbol, ...args: any[]): boolean {
        return this._emitter.emit(event_name, ...args)
    }
}
