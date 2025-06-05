import 'reflect-metadata'
import { load_config } from '@tarpit/config'
import { Platform, TpService, OnStart, OnTerminate } from '@tarpit/core'

@TpService()
class DatabaseService {
    private connection: any
    
    @OnStart()
    async initialize() {
        console.log('DatabaseService: Initializing database connection')
        this.connection = await this.create_database_connection()
        console.log('DatabaseService: Database connection established')
    }
    
    @OnTerminate()
    async cleanup() {
        console.log('DatabaseService: Closing database connection')
        if (this.connection) {
            await this.connection.close()
            console.log('DatabaseService: Database connection closed')
        }
    }
    
    private async create_database_connection() {
        // Simulate database connection setup
        await new Promise(resolve => setTimeout(resolve, 100))
        return {
            close: async () => {
                console.log('DatabaseService: Connection.close() called')
                await new Promise(resolve => setTimeout(resolve, 50))
            }
        }
    }
    
    query(sql: string) {
        if (!this.connection) {
            throw new Error('Database not connected')
        }
        console.log(`DatabaseService: Executing query: ${sql}`)
        return { rows: 3, success: true }
    }
}

@TpService()
class CacheService {
    private cache = new Map<string, any>()
    private background_cleaner: any
    
    @OnStart()
    async initialize() {
        console.log('CacheService: Starting cache service')
        
        // Load initial data
        await this.load_initial_data()
        
        // Start background cleaner
        this.background_cleaner = setInterval(() => {
            console.log('CacheService: Running background cleanup')
            this.cleanup_expired_entries()
        }, 5000)
        
        console.log('CacheService: Cache service started successfully')
    }
    
    @OnTerminate()
    async cleanup() {
        console.log('CacheService: Shutting down cache service')
        
        // Stop background cleaner
        if (this.background_cleaner) {
            clearInterval(this.background_cleaner)
            console.log('CacheService: Background cleaner stopped')
        }
        
        // Persist important data
        await this.persist_cache_data()
        
        // Clear cache
        this.cache.clear()
        console.log('CacheService: Cache cleared and service shut down')
    }
    
    private async load_initial_data() {
        console.log('CacheService: Loading initial cache data')
        this.cache.set('startup_time', new Date().toISOString())
        this.cache.set('cache_size_limit', 1000)
        await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    private cleanup_expired_entries() {
        // Mock cleanup logic
        const beforeSize = this.cache.size
        console.log(`CacheService: Checked ${beforeSize} entries for expiration`)
    }
    
    private async persist_cache_data() {
        console.log('CacheService: Persisting important cache data')
        // Mock persistence logic
        await new Promise(resolve => setTimeout(resolve, 100))
        console.log('CacheService: Cache data persisted')
    }
    
    get(key: string) {
        console.log(`CacheService: Getting ${key}`)
        return this.cache.get(key)
    }
    
    set(key: string, value: any) {
        console.log(`CacheService: Setting ${key} = ${value}`)
        this.cache.set(key, value)
    }
}

@TpService()
class NotificationService {
    private email_queue: string[] = []
    private sms_queue: string[] = []
    
    @OnStart()
    async initialize() {
        console.log('NotificationService: Initializing notification service')
        
        // Setup email client
        await this.setup_email_client()
        
        // Setup SMS client
        await this.setup_sms_client()
        
        // Start queue processors
        await this.start_queue_processors()
        
        console.log('NotificationService: All notification channels ready')
    }
    
    @OnTerminate()
    async cleanup() {
        console.log('NotificationService: Shutting down notification service')
        
        // Process remaining queue items
        await this.process_remaining_notifications()
        
        // Close connections
        await this.close_connections()
        
        console.log('NotificationService: Notification service shut down')
    }
    
    private async setup_email_client() {
        console.log('NotificationService: Setting up email client')
        await new Promise(resolve => setTimeout(resolve, 80))
    }
    
    private async setup_sms_client() {
        console.log('NotificationService: Setting up SMS client')
        await new Promise(resolve => setTimeout(resolve, 60))
    }
    
    private async start_queue_processors() {
        console.log('NotificationService: Starting queue processors')
        await new Promise(resolve => setTimeout(resolve, 40))
    }
    
    private async process_remaining_notifications() {
        console.log(`NotificationService: Processing ${this.email_queue.length} remaining emails`)
        console.log(`NotificationService: Processing ${this.sms_queue.length} remaining SMS`)
        // Mock processing
        this.email_queue = []
        this.sms_queue = []
        await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    private async close_connections() {
        console.log('NotificationService: Closing notification service connections')
        await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    send_email(to: string, subject: string) {
        console.log(`NotificationService: Queuing email to ${to}: ${subject}`)
        this.email_queue.push(`${to}:${subject}`)
    }
    
    send_sms(to: string, message: string) {
        console.log(`NotificationService: Queuing SMS to ${to}: ${message}`)
        this.sms_queue.push(`${to}:${message}`)
    }
}

async function main() {
    console.log('=== TpLoader Decorators Example ===\n')
    
    // Create platform with services
    const platform = new Platform(load_config({}))
        .import(DatabaseService)
        .import(CacheService)
        .import(NotificationService)
    
    console.log('1. Starting platform (this will trigger @OnStart methods):')
    await platform.start()
    
    console.log('\n2. Using services after initialization:')
    const dbService = platform.expose(DatabaseService)!
    const cacheService = platform.expose(CacheService)!
    const notificationService = platform.expose(NotificationService)!
    
    // Use database service
    dbService.query('SELECT * FROM users')
    
    // Use cache service
    cacheService.set('user:123', { name: 'Alice', age: 30 })
    const userData = cacheService.get('user:123')
    console.log('CacheService: Retrieved user data:', userData)
    
    // Use notification service
    notificationService.send_email('alice@example.com', 'Welcome!')
    notificationService.send_sms('+1234567890', 'Your account is ready')
    
    console.log('\n3. Terminating platform (this will trigger @OnTerminate methods):')
    await platform.terminate()
    
    console.log('\n=== Example completed ===')
}

if (require.main === module) {
    main().catch(console.error)
} 