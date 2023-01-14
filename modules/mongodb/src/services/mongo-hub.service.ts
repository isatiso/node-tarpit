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
import { FakeCollection } from '../tools/generic-collection'

@TpService({ inject_root: true })
export class MongoHubService {

    client: MongoClient
    started = false

    // @ts-ignore
    private readonly uri = this.config.get('mongodb.uri')
    // @ts-ignore
    private readonly options?: MongoClientOptions = this.config.get('mongodb.options')

    constructor(
        private config: ConfigData
    ) {
        this.client = new MongoClient(this.uri, { ...this.options })
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

        if (!(meta.cls.prototype instanceof FakeCollection)) {
            throw new Error('A TpMongo class must inherit from GenericCollection.')
        }

        if (!(meta.provider instanceof ClassProvider)) {
            throw new Error('A TpMongo class must be provided by a ClassProvider.')
        }

        meta.provider.create()
        const collection = this.client.db(meta.db).collection(meta.collection)
        let instance = meta.provider.resolved
        while (instance && Object.getPrototypeOf(instance) !== FakeCollection.prototype) {
            instance = Object.getPrototypeOf(instance)
        }
        if (!instance) {
            throw new Error('Can\'t find FakeCollection on the chain.')
        }
        Object.setPrototypeOf(instance, collection)
    }
}
