/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Platform, TpInspector, TpRoot } from '@tarpit/core'
import { HttpServerModule, Post, Get, RawBody, TpRouter, Params } from '@tarpit/http'
import { GenericCollection, MongodbModule, TpMongo } from '@tarpit/mongodb'

@TpMongo('main', 'user')
class AccountData extends GenericCollection<any>() {
    guess() {
        return AccountData
    }
}

@TpRouter('/')
class TestRouter {

    constructor(
        private account: AccountData,
    ) {

    }

    @Get()
    async asd(params: Params<{ id: string }>) {
        await this.account.updateOne({ id: params.get_first('id') }, { $set: { name: 'tarpit' } }, { upsert: true })
        return this.account.findOne({ id: params.get_first('id') })
    }

    @Post()
    async test(
        buf: RawBody,
    ) {
        return buf
    }
}

@TpRoot({
    providers: [
        AccountData
    ],
    entries: [
        TestRouter
    ],
})
export class TestRoot {
}

;(async () => {
    const platform = new Platform({
        http: {
            port: 3000,
            expose_error: true,
            body: {
                max_length: 1000000
            }
        },
        mongodb: {
            uri: 'mongodb://root:7XQPqnNLGmVhmyrFNtiHqefT4hNPrU3z@112.74.191.78:27017/admin?connectTimeoutMS=10000&authSource=admin&authMechanism=SCRAM-SHA-256'
        },
        rabbitmq: {
            url: 'amqp://plank:ChKNwziiY84DjUP@112.74.191.78:5672',
            prefetch: 10,
            socket_options: {}
        }
    }).import(HttpServerModule)
        .import(MongodbModule)

    platform.bootstrap(TestRoot).start()
    await platform.expose(TpInspector)?.wait_start()
})()


