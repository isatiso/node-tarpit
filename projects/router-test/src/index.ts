/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpInspector, TpRoot } from '@tarpit/core'
import { Get, HttpInspector, HttpServerModule, HttpStatic, PathArgs, Post, RawBody, TpRequest, TpResponse, TpRouter } from '@tarpit/http'
import { Jtl } from '@tarpit/judge'
// import { GenericCollection, MongodbModule, TpMongo } from '@tarpit/mongodb'

// @TpMongo('main', 'user')
// class AccountData extends GenericCollection<any>() {
//     guess() {
//         return AccountData
//     }
// }
//
// @TpMongo('main', 'ea')
// class EnhancedAccountData extends AccountData {
//
// }

@TpRouter('/')
class TestRouter {

    constructor(
        private inspector: HttpInspector,
        // private account: AccountData,
        // private ea: EnhancedAccountData,
        private http_static: HttpStatic,
    ) {
    }

    @Get('assets/(.+\\..+)')
    async avatar(args: PathArgs<{ user_id: string }>, request: TpRequest, response: TpResponse) {
        return this.http_static.serve(request, response)
    }

    @Get('account/:user_id/:item_id')
    async asd(args: PathArgs<{ user_id: string, item_id: string }>) {
        const user_id = args.ensure('user_id', Jtl.string)
        const item_id = args.ensure('item_id', Jtl.string)
        return { user_id, item_id }
        // await this.account.updateOne({ id: args.ensure('user_id', Jtl.string) }, { $set: { name: args.ensure('item_id', Jtl.string) } }, { upsert: true })
        // return this.account.findOne({ id: args.ensure('user_id', Jtl.string) })
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
        // AccountData,
        // EnhancedAccountData,
    ],
    entries: [
        TestRouter
    ],
})
export class TestRoot {
}

;(async () => {
    const platform = new Platform(load_config<TpConfigSchema>({
        http: {
            port: 3000,
            expose_error: true,
            static: {
                root: '/Users/plank/Downloads'
            }
        },
        // mongodb: {
        //     uri: 'mongodb://root:7XQPqnNLGmVhmyrFNtiHqefT4hNPrU3z@112.74.191.78:27017/admin?connectTimeoutMS=10000&authSource=admin&authMechanism=SCRAM-SHA-256'
        // },
    })).import(HttpServerModule)
    // .import(MongodbModule)

    platform.bootstrap(TestRoot).start()
    await platform.expose(TpInspector)?.wait_start()
})()


