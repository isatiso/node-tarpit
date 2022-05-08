import { TpConfigSchema } from '@tarpit/config'
import { Platform, TpRoot } from '@tarpit/core'
import { Get, TpRouter, TpServer } from '@tarpit/http'

@TpRouter('/')
class TestRouter {

    @Get('asd')
    async test() {
        return { a: 123 }
    }
}

@TpRoot({
    routers: [
        TestRouter
    ]
})
class TestRoot {
}

const config_data: TpConfigSchema = {
    http: {
        port: 3000
    }
}

new Platform(config_data)
    .plug(TpServer)
    .bootstrap(TestRoot)
    .start()
