/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData } from '@tarpit/config'
import { TpService } from '@tarpit/core'
import { MongoClient, MongoClientOptions } from 'mongodb'

import { TpMongo } from '../annotations/tp-mongo'
import { StubCollection } from '../tools/generic-collection'
import { TpMongoClientConfigMap } from '../types'

type MongoDBClientMap = {
    [K in keyof TpMongoClientConfigMap]: MongoClient
}

@TpService({ inject_root: true })
export class MongoHubService {

    started = false
    private readonly client_map: MongoDBClientMap

    constructor(
        private config: ConfigData
    ) {
        const config_map: TpMongoClientConfigMap = {
            mongodb: {
                url: this.config.get('mongodb.url'),
                options: this.config.get('mongodb.options'),
            },
            ...this.config.get('mongodb.other_clients' as any)
        }
        this.client_map = Object.fromEntries(
            Object.entries(config_map)
                .map(([k, v]) => [k, new MongoClient(v.url, v.options as MongoClientOptions)])
        ) as any
    }

    async start() {
        await Promise.all(Object.values(this.client_map).map(c => c.connect()))
        this.started = true
    }

    async stop() {
        this.started = false
        await Promise.all(Object.values(this.client_map).map(c => {
            c.removeAllListeners()
            return c.close()
        }))
    }

    load(meta: TpMongo) {

        if (Object.getPrototypeOf(meta.cls.prototype) !== StubCollection.prototype) {
            throw new Error('A TpMongo class must inherit from GenericCollection directly.')
        }
        const client_name: keyof TpMongoClientConfigMap = meta.client_name ?? 'mongodb'
        if (!this.client_map[client_name]) {
            throw new Error(`Can not find specified MongoClient of name ${client_name}`)
        }

        const collection = this.client_map[client_name].db(meta.db).collection(meta.collection)
        Object.setPrototypeOf(meta.cls.prototype, collection)
    }
}
