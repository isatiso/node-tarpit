/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Platform, TpRoot } from '@tarpit/core'
import { Get, TpHttpServer, TpRouter } from '@tarpit/http'
import { AssertExchange, AssertQueue, BindQueue, Consume, Letter, Produce, Producer, TpConsumer, TpProducer, TpRabbitMQ } from '@tarpit/rabbitmq'
import { Task, TpSchedule, TpTrigger } from '@tarpit/schedule'

const media_watch_history = 'media_watch_history'
const media_watch_history_add = 'media_watch_history_add'

@TpProducer({
    assertions: [
        AssertExchange(media_watch_history, 'topic', {}),
        AssertQueue(media_watch_history_add, {}),
    ],
    bindings: [
        BindQueue(media_watch_history, media_watch_history_add, media_watch_history_add),
    ],
})
export class TestProducer {

    @Produce(media_watch_history, media_watch_history_add)
    print_a!: Producer<{ a: string }>
}

@TpConsumer()
export class TestConsumer {

    constructor() {
    }

    @Consume(media_watch_history_add, { prefetch: 10 })
    async print_a(msg: Letter<{ a: string }>) {
        const { a } = msg.content
        console.log(a, Date.now())
        return
    }
}

@TpRouter('/', {
    providers: [
        TestProducer
    ]
})
class TestRouter {

    constructor(
        private producer: TestProducer,
        private platform: Platform
    ) {
    }

    @Get('asd')
    async test() {
        await this.producer.print_a({ a: 'qwe' })
        setTimeout(() => this.platform.destroy(), 2000)
        return { a: 123 }
    }
}

@TpSchedule()
class TestSchedule {

    constructor(
        // private platform: Platform
    ) {
    }

    @Task('*/5 * * * * *')
    async test() {
        console.log('asd')
        // await this.platform.destroy()
    }
}

@TpRoot({
    routers: [
        TestRouter
    ],
    schedules: [
        TestSchedule
    ],
    consumers: [
        TestConsumer
    ]
})
class TestRoot {
}

const platform = new Platform()
    .plug(TpHttpServer)
    .plug(TpTrigger)
    .plug(TpRabbitMQ)
    .bootstrap(TestRoot)
    .start()

