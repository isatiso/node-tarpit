import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema } from '@tarpit/core'
import { HttpServerModule, TpRouter, Get, PathArgs } from '@tarpit/http'
import { Jtl } from '@tarpit/judge'

@TpRouter('/')
class HelloRouter {
    
    @Get('hello')
    async say_hello() {
        return { message: 'Hello, Tarpit!' }
    }
    
    @Get('user/:id')
    async get_user(args: PathArgs<{ id: string }>) {
        const user_id = args.ensure('id', Jtl.string)
        return { user_id, name: `User ${user_id}` }
    }
}

const config = load_config<TpConfigSchema>({ 
    http: { port: 4100 } 
})

const platform = new Platform(config)
    .import(HttpServerModule)
    .import(HelloRouter)
    .start() 