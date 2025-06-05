import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'

// 1. Declaration - Mark classes as injectable services
@TpService()
class DatabaseService {
    connect() {
        console.log('Connected to database')
    }
    
    query(sql: string) {
        console.log(`Executing query: ${sql}`)
        return []
    }
}

@TpService()
class UserService {
    // 2. Dependency will be injected automatically
    constructor(private db: DatabaseService) {}
    
    create_user(name: string) {
        this.db.connect()
        const result = this.db.query(`INSERT INTO users (name) VALUES ('${name}')`)
        console.log(`Created user: ${name}`)
        return { id: Date.now(), name }
    }
    
    find_user(name: string) {
        this.db.connect()
        const result = this.db.query(`SELECT * FROM users WHERE name = '${name}'`)
        console.log(`Found user: ${name}`)
        return result
    }
}

async function main() {
    console.log('=== Dependency Injection Basic Example ===\n')
    
    // 3. Registration - Register services with platform
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
        .import(DatabaseService)
        .import(UserService)
    
    await platform.start()
    
    // 4. Resolution - Get fully injected instances
    const user_service = platform.expose(UserService)
    if (!user_service) {
        throw new Error('UserService not found')
    }
    
    console.log('Creating users...')
    user_service.create_user('Alice')
    user_service.create_user('Bob')
    
    console.log('\nFinding users...')
    user_service.find_user('Alice')
    
    await platform.terminate()
    console.log('\n=== Example completed ===')
}

if (require.main === module) {
    main().catch(console.error)
} 