/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Barbeque } from '@tarpit/barbeque'
import { Injector } from '@tarpit/core'
import { Options } from 'amqplib'
import { RabbitProduceSession } from './session'

function narrow_to_buffer(message: string | object | Buffer): Buffer {
    if (Buffer.isBuffer(message)) {
        return message
    } else if (typeof message === 'string') {
        return Buffer.from(message)
    } else {
        return Buffer.from(JSON.stringify(message))
    }
}

export class Producer<T extends string | object | Buffer> {

    public readonly session = RabbitProduceSession.create(this.injector)
    private _cache = new Barbeque<[message: Buffer, produce_options: Options.Publish | undefined, resolve: (data: any) => void, reject: (err: any) => void]>()

    constructor(
        private target: string,
        private routing_key: string | undefined,
        private injector: Injector,
    ) {
        this.session.on_create(() => this.flush())
    }

    async send(message: T, options?: Options.Publish): Promise<void> {
        const buf = narrow_to_buffer(message)
        if (!this.session.channel) {
            return new Promise((resolve, reject) => {
                this._cache.push([buf, options, resolve, reject])
            })
        } else {
            return this.session.send(this.target, this.routing_key, buf, options)
        }
    }

    async flush() {
        while (this._cache.length) {
            const [buf, options, resolve, reject] = this._cache.shift()!
            await this.session.send(this.target, this.routing_key, buf, options)
                .then(() => resolve(null))
                .catch(err => reject(err))
        }
    }
}
