import 'reflect-metadata'
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService, OnStart, OnTerminate } from '@tarpit/core'
import { createWriteStream } from 'node:fs'
import { unlink } from 'node:fs/promises'
import { join } from 'node:path'

@TpService()
class DatabaseService {
    private isConnected = false
    private client?: any
    
    @OnStart()
    async initialize() {
        console.log('DatabaseService: Starting connection...')
        await this.connect()
        this.isConnected = true
        console.log('DatabaseService: Connected successfully')
    }
    
    @OnTerminate()
    async cleanup() {
        console.log('DatabaseService: Closing connections...')
        
        if (this.client) {
            await this.client.close()
            console.log('DatabaseService: All connections closed')
        }
    }
    
    private async connect() {
        // Database connection logic - simulate delay
        await new Promise(resolve => setTimeout(resolve, 100))
        this.client = {
            close: async () => {
                console.log('DatabaseService: Database client closed')
            }
        }
    }
    
    query(sql: string) {
        if (!this.isConnected) {
            throw new Error('Database not connected')
        }
        console.log(`DatabaseService: Executing query: ${sql}`)
        return { rows: 3, success: true }
    }
}

@TpService()
class CacheService {
    private cache = new Map<string, any>()
    private cleanupInterval?: NodeJS.Timeout
    private tempFiles: string[] = []
    
    @OnStart()
    async initialize() {
        console.log('CacheService: Initializing cache...')
        await this.load_initial_data()
        
        // Setup periodic cleanup
        this.cleanupInterval = setInterval(() => {
            this.cleanup_expired_entries()
        }, 5000) // 5 seconds for demo
        
        // Create a temporary file for demo
        const tempFile = join(process.cwd(), 'cache-temp.tmp')
        this.tempFiles.push(tempFile)
        const stream = createWriteStream(tempFile)
        stream.write('Cache initialized\n')
        stream.end()
        
        console.log('CacheService: Cache initialized with periodic cleanup')
    }
    
    @OnTerminate()
    async cleanup() {
        console.log('CacheService: Shutting down...')
        
        try {
            // Clear the cleanup interval
            if (this.cleanupInterval) {
                clearInterval(this.cleanupInterval)
                console.log('CacheService: Cleanup interval cleared')
            }
            
            // Save cache to persistent storage if needed
            await this.persist_cache_data()
            
            // Clean up temporary files
            await Promise.all(
                this.tempFiles.map(async file => {
                    try {
                        await unlink(file)
                        console.log(`CacheService: Cleaned up file: ${file}`)
                    } catch (error) {
                        console.log(`CacheService: File already cleaned: ${file}`)
                    }
                })
            )
            
            // Clear the cache
            const size = this.cache.size
            this.cache.clear()
            console.log(`CacheService: Cache cleared (${size} entries)`)
            
            console.log('CacheService: Shutdown complete')
        } catch (error) {
            console.error('CacheService: Error during cleanup:', error)
            // Don't throw - allow other services to terminate
        }
    }
    
    private async load_initial_data() {
        // Load initial cache data
        this.cache.set('user:1', { name: 'Alice', age: 30 })
        this.cache.set('user:2', { name: 'Bob', age: 25 })
        console.log('CacheService: Initial data loaded (2 entries)')
    }
    
    private cleanup_expired_entries() {
        console.log('CacheService: Running periodic cleanup...')
        console.log(`CacheService: Current cache size: ${this.cache.size}`)
    }
    
    private async persist_cache_data() {
        console.log('CacheService: Persisting cache data...')
        // Simulate saving cache data
        await new Promise(resolve => setTimeout(resolve, 50))
        console.log('CacheService: Cache data persisted')
    }
    
    get(key: string) {
        return this.cache.get(key)
    }
    
    set(key: string, value: any) {
        this.cache.set(key, value)
        console.log(`CacheService: Set ${key}`)
    }
}

@TpService()
class UserService {
    constructor(
        private db: DatabaseService,
        private cache: CacheService
    ) {}
    
    create_user(name: string, age: number) {
        console.log(`UserService: Creating user ${name} (${age} years old)`)
        
        // Save to database
        const result = this.db.query(`INSERT INTO users (name, age) VALUES ('${name}', ${age})`)
        
        // Cache the user
        const user = { id: Date.now(), name, age }
        this.cache.set(`user:${user.id}`, user)
        
        return user
    }
    
    find_user(id: number) {
        console.log(`UserService: Finding user ${id}`)
        
        // Try cache first
        const cached = this.cache.get(`user:${id}`)
        if (cached) {
            console.log('UserService: Found in cache')
            return cached
        }
        
        // Query database
        this.db.query(`SELECT * FROM users WHERE id = ${id}`)
        const user = { id, name: 'Found User', age: 30 }
        
        // Cache the result
        this.cache.set(`user:${id}`, user)
        
        return user
    }
}

async function demonstrate_lifecycle_hooks() {
    console.log('=== Lifecycle Hooks Demonstration ===\n')
    
    // Create platform
    const config = load_config<TpConfigSchema>({})
    
    const platform = new Platform(config)
        .import(DatabaseService)
        .import(CacheService)
        .import(UserService)
    
    console.log('1. Platform created, services imported')
    
    // Start platform - this will trigger @OnStart hooks
    console.log('\n2. Starting platform (will trigger @OnStart hooks)...')
    const startTime = await platform.start()
    console.log(`✓ Platform started in ${startTime}s`)
    
    // Use the services
    console.log('\n3. Using services to demonstrate functionality...')
    const userService = platform.expose(UserService)
    
    if (userService) {
        const user1 = userService.create_user('Alice', 30)
        const user2 = userService.create_user('Bob', 25)
        
        console.log('Created users:', [user1, user2])
        
        // Find a user
        const foundUser = userService.find_user(user1.id)
        console.log('Found user:', foundUser)
    }
    
    // Wait a bit to see periodic cleanup
    console.log('\n4. Waiting to see periodic cleanup...')
    await new Promise(resolve => setTimeout(resolve, 6000))
    
    // Terminate platform - this will trigger @OnTerminate hooks
    console.log('\n5. Terminating platform (will trigger @OnTerminate hooks)...')
    const terminateTime = await platform.terminate()
    console.log(`✓ Platform terminated in ${terminateTime}s`)
    
    console.log('\n=== Lifecycle Hooks Demonstration Complete ===')
    console.log('\nKey lifecycle features demonstrated:')
    console.log('- @OnStart hooks for service initialization')
    console.log('- @OnTerminate hooks for cleanup and resource management')
    console.log('- Automatic resource cleanup (files, intervals, connections)')
    console.log('- Graceful error handling during cleanup')
}

async function main() {
    await demonstrate_lifecycle_hooks()
}

if (require.main === module) {
    main().catch(console.error)
} 