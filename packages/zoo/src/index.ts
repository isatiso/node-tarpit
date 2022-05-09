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
        private producer: TestProducer
    ) {
    }

    @Get('asd')
    async test() {
        await this.producer.print_a({ a: 'qwe' })
        return { a: 123 }
    }
}

@TpSchedule()
class TestSchedule {

    @Task('*/5 * * * * *')
    async test() {
        console.log('asd')
    }
}

@TpRoot({
    routers: [
        TestRouter
    ],
    schedules: [
        // TestSchedule
    ],
    consumers: [
        TestConsumer
    ]
})
class TestRoot {
}

new Platform()
    .plug(TpHttpServer)
    .plug(TpTrigger)
    .plug(TpRabbitMQ)
    .bootstrap(TestRoot)
    .start()
