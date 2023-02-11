/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData } from '@tarpit/config'
import { ClassProvider, TpService } from '@tarpit/core'
import { MongoClient, MongoClientOptions } from 'mongodb'

import { TpMongo } from '../annotations/tp-mongo'
import { StubCollection } from '../tools/generic-collection'

@TpService({ inject_root: true })
export class MongoHubService {

    client: MongoClient
    started = false

    // @ts-ignore
    private readonly url = this.config.get('mongodb.url')
    // @ts-ignore
    private readonly options?: MongoClientOptions = this.config.get('mongodb.options')

    constructor(
        private config: ConfigData
    ) {
        this.client = new MongoClient(this.url, { ...this.options })
    }

    async start() {
        await this.client.connect()
        this.started = true
    }

    async stop() {
        this.started = false
        this.client.removeAllListeners()
        await this.client.close()
    }

    load(meta: TpMongo) {

        if (Object.getPrototypeOf(meta.cls.prototype) !== StubCollection.prototype) {
            throw new Error('A TpMongo class must inherit from GenericCollection directly.')
        }

        const collection = this.client.db(meta.db).collection(meta.collection)
        Object.setPrototypeOf(meta.cls.prototype, collection)
    }
}
