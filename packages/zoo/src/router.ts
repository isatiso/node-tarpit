/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Inject, Optional, Platform, TpInspector, TpRoot, TpService } from '@tarpit/core'
import { BodyDetector, HttpInspector, HttpServerModule, Post, TpRouter } from '@tarpit/http'
import { Jtl } from '@tarpit/judge'
import { TestService1 } from './test-service.1'
import { SymbolToken, TestService2 } from './test-service.2'

@TpService()
class TestService {
    constructor(
        @Optional()
        @Inject('œœ-TpStartedAtaefaef')
        private aaa: number,
        ts: TestService1
    ) {
    }
}

@TpRouter('/', {
    providers: [
        // TestProducer,
        TestService,
        TestService1,
        TestService2,
        {
            provide: SymbolToken,
            useFactory: (aaa: number) => {
                return 123
            },
            deps: [
                [
                    new Optional(),
                    new Inject('œœ-TpStartedAt1111111')
                ]
            ]
        }
    ]
})
class TestRouter {

    constructor(
        private inspector: TpInspector,
        @Optional()
        @Inject('œœ-TpStartedAtaefaef')
        private aaa: number,
        // private producer: TestProducer,
        // private platform: Platform
    ) {
    }

    @Post('asd')
    async test(
        ts: TestService,
        @Inject(BodyDetector)
            detector: BodyDetector,
        @Optional()
        @Inject('œœ-TpStartedAtaefaef')
            aaa: number,
    ) {
        console.log(this.inspector.started_at)
        console.log(this.aaa, aaa)
        const detect_result = detector.detect<{ name: string, email: string, count: number }>()
        if (detect_result.type === 'json') {
            const body = detect_result.body
            const name = body.ensure('name', Jtl.string)
            const email = body.ensure('email', Jtl.string)
            const count = body.ensure('count', Jtl.multiple_of(7))
            return { name, email, count }
        } else {
            return null
        }
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
            port: 3000
        }
    }).import(HttpServerModule).bootstrap(TestRoot).start()
    await platform.prepare()
    console.log(platform.expose_service(HttpInspector)?.list_router())
    // platform.terminate()
    // console.log(platform.expose_service(STARTUP_TIME), platform.expose_service(SHUTDOWN_TIME))
})()
