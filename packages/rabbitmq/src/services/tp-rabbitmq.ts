import { ConfigData } from '@tarpit/config'
import { Injector, ValueProvider } from '@tarpit/core'
import { Options } from 'amqplib'
import { EventEmitter } from 'events'

/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

export class TpRabbitmq {

    private readonly emitter = new EventEmitter()

    public url?: string | Options.Connect
    public prefetch?: number
    public socket_options?: any

    constructor(
        private injector: Injector,
        private config_data: ConfigData
    ) {
        this.emitter.setMaxListeners(1000)
        const { url, prefetch, socket_options } = this.config_data.get('rabbitmq')
        this.url = url
        this.prefetch = prefetch
        this.socket_options = socket_options
    }

    create_channel() {

    }
}
