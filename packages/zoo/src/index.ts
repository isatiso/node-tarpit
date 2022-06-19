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

//
// @TpProducer({
//     assertions: [
//         AssertExchange(media_watch_history, 'topic', {}),
//         AssertQueue(media_watch_history_add, {}),
//     ],
//     bindings: [
//         BindQueue(media_watch_history, media_watch_history_add, media_watch_history_add),
//     ],
// })
// export class TestProducer {
//
//     @Produce(media_watch_history, media_watch_history_add)
//     print_a!: Producer<{ a: string }>
// }
//
// @TpConsumer()
// export class TestConsumer {
//
//     constructor() {
//     }
//
//     @Consume(media_watch_history_add, { prefetch: 10 })
//     async print_a(msg: Letter<{ a: string }>) {
//         const { a } = msg.content
//         console.log(a, Date.now())
//         return
//     }
// }

// @TpSchedule()
// class TestSchedule {
//
//     constructor(
//         // private platform: Platform
//     ) {
//     }
//
//     @Task('*/5 * * * * *')
//     async test() {
//         console.log('asd')
//         // await this.platform.destroy()
//     }
// }

// @TpService()
// export class ZooLogger extends TpLogger {
//
//     constructor(
//         private config_data: ConfigData,
//         private injector: Injector,
//     ) {
//         super()
//     }
//
//     after_start() {
//         const started_at = this.injector.get<number>(STARTUP_AT)?.create() ?? 0
//         const duration = (Date.now() - started_at) / 1000
//         this.injector.emit('startup-duration', duration)
//         // console.log(`tarpit server started at ${new Date().toISOString()}, during ${duration}s`)
//     }
//
//     after_destroy() {
//         const destroyed_at = this.injector.get<number>('œœ-TpDestroyedAt')?.create() ?? 0
//         const duration = (Date.now() - destroyed_at) / 1000
//         this.injector.emit('shutdown-duration', duration)
//         // console.log(`tarpit server destroyed at ${new Date().toISOString()}, during ${duration}s`)
//     }
// }

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

