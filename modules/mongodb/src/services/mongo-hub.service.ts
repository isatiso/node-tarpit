/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Barbeque } from '@tarpit/barbeque'
import { ConfigData } from '@tarpit/config'
import { ClassProvider, TpService } from '@tarpit/core'
import { MongoClient, MongoClientOptions } from 'mongodb'

import { TpMongo } from '../annotations/tp-mongo'
import { FakeCollection } from '../tools/generic-collection'

@TpService({ inject_root: true })
export class MongoHubService {

    client: MongoClient
    started = false

    private meta_cache = new Barbeque<TpMongo>()

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
        let meta: TpMongo | undefined
        while (meta = this.meta_cache.shift()) {
            this._init_collection(meta)
        }
    }

    async stop() {
        this.started = false
        this.client.removeAllListeners()
        await this.client.close()
    }

    add(meta: TpMongo) {
        if (Object.getPrototypeOf(meta.cls) !== FakeCollection) {
            throw new Error('A TpMongo class must inherit from GenericCollection')
        }
        if (meta.provider instanceof ClassProvider) {
            meta.provider.create()
            const collection = this.client.db(meta.db).collection(meta.collection)

            Object.setPrototypeOf(Object.getPrototypeOf(meta.provider.resolved), collection)
        }
    }

    private _init_collection(meta: TpMongo) {

        // console.log(instance)
    }
}
