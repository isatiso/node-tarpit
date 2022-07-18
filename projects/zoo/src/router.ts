/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Platform, TpInspector, TpRoot } from '@tarpit/core'
import { HttpServerModule, Post, RawBody, TpRouter } from '@tarpit/http'

@TpRouter('/')
class TestRouter {

    constructor() {
    }

    @Post('asd')
    async test(
        buf: RawBody,
    ) {
        return buf
    }
}

@TpRoot({
    entries: [
        TestRouter
    ],
})
export class TestRoot {
}

(async () => {
    const platform = new Platform({
        http: {
            port: 3000,
            body: {
                max_length: 1000000
            }
        },
        rabbitmq: {
            url: 'amqp://plank:ChKNwziiY84DjUP@112.74.191.78:5672',
            prefetch: 10,
            socket_options: {}
        }
    }).import(HttpServerModule)

    platform.bootstrap(TestRoot).start()
    await platform.expose(TpInspector)?.wait_start()
})()


