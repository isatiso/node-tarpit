/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Platform, TpInspector, TpRoot } from '@tarpit/core'
import { Get, HttpServerModule, Params, Post, RawBody, TpRouter } from '@tarpit/http'
import { GenericCollection, MongodbModule, TpMongo } from '@tarpit/mongodb'


class AccountData extends GenericCollection<any>() {
    guess() {
        return AccountData
    }
}

@TpMongo('main', 'user')
class EnhancedAccountData extends AccountData {

}

@TpRouter('/')
class TestRouter {

    constructor(
        private account: EnhancedAccountData,
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
        EnhancedAccountData,
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
        },
        mongodb: {
            uri: 'mongodb://root:7XQPqnNLGmVhmyrFNtiHqefT4hNPrU3z@112.74.191.78:27017/admin?connectTimeoutMS=10000&authSource=admin&authMechanism=SCRAM-SHA-256'
        },
    }).import(HttpServerModule)
        .import(MongodbModule)

    platform.bootstrap(TestRoot).start()
    await platform.expose(TpInspector)?.wait_start()
})()


