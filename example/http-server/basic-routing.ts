import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'
import { HttpServerModule, TpRouter, Get, Post, Put, Delete } from '@tarpit/http'

// Simple data store service
@TpService()
class DataStore {
    private data = new Map<string, any>()
    
    get_all() {
        return Array.from(this.data.entries()).map(([id, value]) => ({ id, ...value }))
    }
    
    get_by_id(id: string) {
        return this.data.get(id)
    }
    
    create(item: any) {
        const id = Date.now().toString()
        this.data.set(id, { ...item, created_at: new Date().toISOString() })
        return { id, ...this.data.get(id) }
    }
    
    update(id: string, item: any) {
        if (!this.data.has(id)) {
            return null
        }
        const existing = this.data.get(id)
        this.data.set(id, { ...existing, ...item, updated_at: new Date().toISOString() })
        return { id, ...this.data.get(id) }
    }
    
    delete(id: string) {
        return this.data.delete(id)
    }
}

// HTTP Router demonstrating basic routing
@TpRouter('/api/resources')
class ResourceRouter {
    
    constructor(private data_store: DataStore) {}
    
    @Get('list')           // GET /api/resources/list
    async list_resources() {
        console.log('GET /api/resources/list called')
        return {
            method: 'GET',
            endpoint: '/api/resources/list',
            resources: this.data_store.get_all()
        }
    }

    @Post('create')        // POST /api/resources/create
    async create_resource() {
        console.log('POST /api/resources/create called')
        const new_resource = this.data_store.create({
            name: `Resource ${Date.now()}`,
            type: 'example'
        })
        
        return {
            method: 'POST',
            endpoint: '/api/resources/create',
            created: new_resource
        }
    }

    @Put('update')         // PUT /api/resources/update
    async update_resource() {
        console.log('PUT /api/resources/update called')
        const resources = this.data_store.get_all()
        
        if (resources.length > 0) {
            const first_id = resources[0].id
            const updated = this.data_store.update(first_id, {
                name: `Updated Resource ${Date.now()}`,
                status: 'updated'
            })
            
            return {
                method: 'PUT',
                endpoint: '/api/resources/update',
                updated
            }
        }
        
        return {
            method: 'PUT',
            endpoint: '/api/resources/update',
            message: 'No resources to update'
        }
    }

    @Delete('remove')      // DELETE /api/resources/remove
    async delete_resource() {
        console.log('DELETE /api/resources/remove called')
        const resources = this.data_store.get_all()
        
        if (resources.length > 0) {
            const first_id = resources[0].id
            const deleted = this.data_store.delete(first_id)
            
            return {
                method: 'DELETE',
                endpoint: '/api/resources/remove',
                deleted,
                message: deleted ? 'Resource deleted' : 'Resource not found'
            }
        }
        
        return {
            method: 'DELETE',
            endpoint: '/api/resources/remove',
            message: 'No resources to delete'
        }
    }
}

// Alternative router using default method names
@TpRouter('/api/users')
class UserRouter {
    
    constructor(private data_store: DataStore) {}
    
    @Get()           // Uses method name: GET /api/users/list
    async list() {
        return {
            endpoint: '/api/users/list',
            users: []
        }
    }
    
    @Post()          // Uses method name: POST /api/users/create
    async create() {
        return {
            endpoint: '/api/users/create',
            id: Date.now(),
            message: 'User created'
        }
    }
}

// Version-specific router
@TpRouter('/api/v1')
class V1Router {
    @Get('status')
    async get_status() {
        return {
            version: 'v1',
            status: 'ok',
            timestamp: new Date().toISOString()
        }
    }
}

@TpRouter('/api/v2')
class V2Router {
    @Get('status')
    async get_status() {
        return {
            version: 'v2',
            status: 'ok',
            features: ['enhanced-auth', 'rate-limiting'],
            timestamp: new Date().toISOString()
        }
    }
}

async function main() {
    console.log('=== Basic Routing Example ===\n')
    
    const config = load_config<TpConfigSchema>({ 
        http: { port: 4200 } 
    })
    
    const platform = new Platform(config)
        .import(HttpServerModule)
        .import(DataStore)
        .import(ResourceRouter)
        .import(UserRouter)
        .import(V1Router)
        .import(V2Router)
    
    await platform.start()
    
    console.log('HTTP Server started on http://localhost:4200')
    console.log('\n=== Available Endpoints ===')
    console.log('Resource Management:')
    console.log('  GET    /api/resources/list   - List all resources')
    console.log('  POST   /api/resources/create - Create a new resource')
    console.log('  PUT    /api/resources/update - Update first resource')
    console.log('  DELETE /api/resources/remove - Delete first resource')
    console.log('\nUser Management:')
    console.log('  GET    /api/users/list       - List users (using default method name)')
    console.log('  POST   /api/users/create     - Create user (using default method name)')
    console.log('\nAPI Versions:')
    console.log('  GET    /api/v1/status        - V1 API status')
    console.log('  GET    /api/v2/status        - V2 API status')
    
    console.log('\n=== Test Commands ===')
    console.log('curl http://localhost:4200/api/resources/list')
    console.log('curl -X POST http://localhost:4200/api/resources/create')
    console.log('curl -X PUT http://localhost:4200/api/resources/update')
    console.log('curl -X DELETE http://localhost:4200/api/resources/remove')
    console.log('curl http://localhost:4200/api/v1/status')
    console.log('curl http://localhost:4200/api/v2/status')
    
    console.log('\nPress Ctrl+C to stop the server')
}

if (require.main === module) {
    main().catch(console.error)
} 