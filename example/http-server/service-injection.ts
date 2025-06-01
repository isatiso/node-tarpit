import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'
import { HttpServerModule, TpRouter, Get, Post, JsonBody, PathArgs, TpHttpFinish } from '@tarpit/http'
import { Jtl } from '@tarpit/judge'

// Business logic service
@TpService()
class UserService {
    private users = new Map<string, any>()
    
    create_user(user_data: any) {
        const id = Math.random().toString(36).substr(2, 9)
        this.users.set(id, { id, ...user_data })
        return this.users.get(id)
    }
    
    get_user(id: string) {
        return this.users.get(id)
    }
    
    list_users() {
        return Array.from(this.users.values())
    }
}

// HTTP controller with injected service
@TpRouter('/api/users')
class UserRouter {
    
    constructor(private user_service: UserService) {}
    
    @Get('list')
    async list_users() {
        return this.user_service.list_users()
    }
    
    @Get(':id')
    async get_user(args: PathArgs<{ id: string }>) {
        const id = args.ensure('id', Jtl.string)
        const user = this.user_service.get_user(id)
        if (!user) {
            throw new TpHttpFinish({ status: 404, code: '404', msg: 'User not found' })
        }
        return user
    }
    
    @Post('create')
    async create_user(body: JsonBody<{ name: string, email: string }>) {
        const name = body.ensure('name', Jtl.string)
        const email = body.ensure('email', Jtl.string)
        const user_data = { name, email }
        return this.user_service.create_user(user_data)
    }
}

const config = load_config<TpConfigSchema>({ 
    http: { port: 4103 } 
})

// Application setup
const platform = new Platform(config)
    .import(HttpServerModule)
    .import(UserService)      // Register service
    .import(UserRouter)       // Register router
    .start() 