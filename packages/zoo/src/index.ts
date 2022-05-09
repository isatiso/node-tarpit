import { Platform, TpRoot } from '@tarpit/core'
import { Get, TpHttpServer, TpRouter } from '@tarpit/http'
import { TpRabbitMQ } from '@tarpit/rabbitmq'
import { Task, TpSchedule, TpTrigger } from '@tarpit/schedule'

@TpRouter('/')
class TestRouter {

    @Get('asd')
    async test() {
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
        TestSchedule
    ],
})
class TestRoot {
}

new Platform('../tarpit.json')
    .plug(TpHttpServer)
    .plug(TpTrigger)
    .plug(TpRabbitMQ)
    .bootstrap(TestRoot)
    .start()
