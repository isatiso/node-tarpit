import { TpConfigSchema } from '@tarpit/config'
import { Platform, TpRoot } from '@tarpit/core'
import { Get, TpRouter, TpHttpServer } from '@tarpit/http'
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

const config_data: TpConfigSchema = {
    http: {
        port: 3000,
        cors: {
            allow_headers: 'Access-Control-Allow-Origin,origin,Content-Type,Accept,Authorization',
            allow_methods: 'GET,POST,PUT,DELETE,OPTIONS',
            allow_origin: '*'
        }
    }
}

new Platform(config_data)
    .plug(TpHttpServer)
    .plug(TpTrigger)
    .bootstrap(TestRoot)
    .start()
