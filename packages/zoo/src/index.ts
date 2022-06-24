/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Platform, TpInspector } from '@tarpit/core'
import { HttpInspector } from '@tarpit/http'
import { TestRoot } from './router'

(async () => {
    const platform = new Platform({
        http: {
            port: 3000
        }
    }).bootstrap(TestRoot).start()
    await platform.expose(TpInspector)?.wait_start()
    console.log(platform.expose(HttpInspector)?.list_router())

    // const platform = new Platform({ http: { port: 3000 } }).bootstrap(TriggerRoot).start()
    // await platform.expose(TpInspector)?.wait_start()
    //
    // console.log(platform.expose(ScheduleInspector)?.list_bullet())
    // console.log(platform.expose(ScheduleInspector)?.list_suspended())

    // platform.terminate()
    // console.log(platform.expose_service(STARTUP_TIME), platform.expose_service(SHUTDOWN_TIME))
})()

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

// @TpTriggerOld()
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


