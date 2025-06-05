import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService, Inject } from '@tarpit/core'

// Example demonstrating token-based (explicit) injection

// Define custom tokens
const DATABASE_URL = Symbol('DATABASE_URL')
const MAX_CONNECTIONS = Symbol('MAX_CONNECTIONS')

@TpService()
class DatabaseService {
    constructor(
        @Inject(DATABASE_URL) private url: string,
        @Inject(MAX_CONNECTIONS) private max_connections: number
    ) {}
    
    connect() {
        console.log(`Connecting to database: ${this.url}`)
        console.log(`Max connections: ${this.max_connections}`)
    }
}

async function main() {
    console.log('=== Token-Based (Explicit) Injection Example ===\n')
    
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
        .import({ provide: DATABASE_URL, useValue: 'postgresql://localhost:5432/mydb' })
        .import({ provide: MAX_CONNECTIONS, useValue: 10 })
        .import(DatabaseService)
    
    await platform.start()
    
    const db_service = platform.expose(DatabaseService)
    if (!db_service) {
        throw new Error('DatabaseService not found')
    }
    
    db_service.connect()
    
    await platform.terminate()
    console.log('\n=== Example completed ===')
}

if (require.main === module) {
    main().catch(console.error)
} 