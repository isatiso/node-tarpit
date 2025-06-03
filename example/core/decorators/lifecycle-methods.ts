import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService, OnStart, OnTerminate } from '@tarpit/core'

@TpService()
class DatabaseService {
    private connection: any
    private connected = false
    
    constructor() {
        console.log('DatabaseService constructor called')
    }
    
    @OnStart()
    async initialize() {
        console.log('DatabaseService: OnStart - Initializing connection...')
        // Simulate async connection setup
        await new Promise(resolve => setTimeout(resolve, 100))
        this.connection = { id: 'conn_123', status: 'connected' }
        this.connected = true
        console.log('DatabaseService: Connection established successfully')
    }
    
    query(sql: string) {
        if (!this.connected) {
            throw new Error('Database not connected')
        }
        console.log(`Executing query: ${sql}`)
        return { rows: [], count: 0 }
    }
    
    @OnTerminate()
    async cleanup() {
        console.log('DatabaseService: OnTerminate - Closing connection...')
        if (this.connection) {
            // Simulate cleanup
            await new Promise(resolve => setTimeout(resolve, 50))
            this.connection = null
            this.connected = false
        }
        console.log('DatabaseService: Connection closed')
    }
}

@TpService()
class CacheService {
    private cache = new Map<string, any>()
    private cleanup_interval?: NodeJS.Timeout
    
    constructor() {
        console.log('CacheService constructor called')
    }
    
    @OnStart()
    async start_cache_services() {
        console.log('CacheService: OnStart - Starting cache services...')
        
        // Load any existing cache data
        await this.load_persisted_cache()
        
        // Start cleanup timer
        this.cleanup_interval = setInterval(() => {
            console.log('CacheService: Performing periodic cleanup')
            this.cleanup_expired_entries()
        }, 5000)
        
        console.log('CacheService: Cache services started')
    }
    
    private async load_persisted_cache() {
        console.log('CacheService: Loading persisted cache...')
        // Simulate loading cache from disk/database
        await new Promise(resolve => setTimeout(resolve, 50))
        this.cache.set('system_ready', true)
        console.log('CacheService: Persisted cache loaded')
    }
    
    private cleanup_expired_entries() {
        // Example cache expiration logic
        const now = Date.now()
        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp && (now - entry.timestamp) > 60000) { // 1 minute expiry
                this.cache.delete(key)
                console.log(`Cache expired: ${key}`)
            }
        }
    }
    
    set(key: string, value: any) {
        this.cache.set(key, { value, timestamp: Date.now() })
        console.log(`Cache set: ${key}`)
    }
    
    get(key: string) {
        const entry = this.cache.get(key)
        const value = entry?.value
        console.log(`Cache get: ${key} = ${value}`)
        return value
    }
    
    @OnTerminate()
    async cleanup() {
        console.log('CacheService: OnTerminate - Cleaning up...')
        
        if (this.cleanup_interval) {
            clearInterval(this.cleanup_interval)
            console.log('CacheService: Cleanup timer stopped')
        }
        
        // Persist cache before shutdown
        await this.persist_cache()
        
        console.log('CacheService: Clearing in-memory cache')
        this.cache.clear()
        
        console.log('CacheService: Cleanup completed')
    }
    
    private async persist_cache() {
        console.log('CacheService: Persisting cache to storage...')
        // Simulate saving cache to disk/database
        await new Promise(resolve => setTimeout(resolve, 50))
        console.log('CacheService: Cache persisted')
    }
}

@TpService()
class EmailService {
    private email_queue: any[] = []
    private processing = false
    
    constructor(
        private cache: CacheService,
        private db: DatabaseService
    ) {
        console.log('EmailService constructor called')
    }
    
    @OnStart()
    async initialize_email_service() {
        console.log('EmailService: OnStart - Initializing email service...')
        
        // Load any pending emails from database
        const pending_emails = this.db.query('SELECT * FROM pending_emails')
        this.email_queue = pending_emails.rows
        
        console.log(`EmailService: Loaded ${this.email_queue.length} pending emails`)
        
        // Start email processing
        this.processing = true
        this.process_queue()
        
        // Register service status in cache
        this.cache.set('email_service_status', 'active')
        
        console.log('EmailService: Email service initialized successfully')
    }
    
    send_email(to: string, subject: string) {
        const email = { to, subject, timestamp: Date.now() }
        this.email_queue.push(email)
        
        // Cache recent recipients
        this.cache.set(`last_email_${to}`, Date.now())
        
        console.log(`Email queued for ${to}: ${subject}`)
    }
    
    private async process_queue() {
        while (this.processing && this.email_queue.length > 0) {
            const email = this.email_queue.shift()
            console.log(`Processing email to ${email.to}: ${email.subject}`)
            
            // Simulate email sending
            await new Promise(resolve => setTimeout(resolve, 100))
            
            // Wait before processing next email
            await new Promise(resolve => setTimeout(resolve, 200))
        }
    }
    
    @OnTerminate()
    async shutdown() {
        console.log('EmailService: OnTerminate - Shutting down...')
        
        // Update service status
        this.cache.set('email_service_status', 'shutting_down')
        
        // Stop processing
        this.processing = false
        
        // Save any remaining emails to database
        if (this.email_queue.length > 0) {
            console.log(`EmailService: Saving ${this.email_queue.length} pending emails`)
            for (const email of this.email_queue) {
                this.db.query(`INSERT INTO pending_emails (to_address, subject) VALUES ('${email.to}', '${email.subject}')`)
            }
        }
        
        console.log('EmailService: Shutdown completed')
    }
}

// Service with multiple lifecycle methods
@TpService()
class MetricsService {
    private metrics = new Map<string, number>()
    private start_time = 0
    private monitoring_active = false
    
    constructor() {
        console.log('MetricsService constructor called')
    }
    
    @OnStart()
    async start_monitoring() {
        console.log('MetricsService: OnStart - Starting monitoring system...')
        
        this.start_time = Date.now()
        this.monitoring_active = true
        
        // Load historical data
        await this.load_historical_data()
        
        // Set initial metrics
        this.metrics.set('startup_time', this.start_time)
        this.metrics.set('monitoring_status', 1)
        
        console.log('MetricsService: Monitoring system started')
    }
    
    private async load_historical_data() {
        console.log('MetricsService: Loading historical metrics data...')
        // Simulate loading data from storage
        await new Promise(resolve => setTimeout(resolve, 75))
        this.metrics.set('historical_data_loaded', 1)
        this.metrics.set('previous_uptime', 86400000) // Simulate 24h previous uptime
        console.log('MetricsService: Historical data loaded')
    }
    
    record(metric: string, value: number) {
        if (!this.monitoring_active) {
            console.log(`[METRICS] Monitoring not active, skipping: ${metric}`)
            return
        }
        
        this.metrics.set(metric, value)
        console.log(`[METRICS] ${metric}: ${value}`)
    }
    
    get_current_uptime(): number {
        return Date.now() - this.start_time
    }
    
    @OnTerminate()
    async save_metrics() {
        console.log('MetricsService: OnTerminate - Saving metrics...')
        
        // Calculate final uptime
        const uptime = this.get_current_uptime()
        this.metrics.set('final_uptime_ms', uptime)
        this.metrics.set('shutdown_time', Date.now())
        
        // Save all metrics
        console.log('Final metrics summary:', Object.fromEntries(this.metrics))
        
        console.log('MetricsService: Metrics saved successfully')
    }
    
    @OnTerminate()
    async cleanup_resources() {
        console.log('MetricsService: OnTerminate - Cleaning up resources...')
        
        this.monitoring_active = false
        this.metrics.clear()
        
        console.log('MetricsService: Resources cleaned up')
    }
}

async function demonstrate_lifecycle_methods() {
    console.log('=== Lifecycle Methods Example ===')
    console.log('Demonstrating @OnStart and @OnTerminate decorators')
    
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
        .import(DatabaseService)
        .import(CacheService)
        .import(EmailService)
        .import(MetricsService)
    
    console.log('\n--- Platform Starting (constructors + @OnStart methods) ---')
    await platform.start()
    
    console.log('\n--- Services are now fully initialized and running ---')
    const email_service = platform.expose(EmailService)
    const metrics_service = platform.expose(MetricsService)
    const cache_service = platform.expose(CacheService)
    
    if (!email_service || !metrics_service || !cache_service) {
        throw new Error('Services not found')
    }
    
    // Use the services
    console.log('\n--- Using Services ---')
    email_service.send_email('user1@example.com', 'Welcome!')
    email_service.send_email('user2@example.com', 'Hello!')
    
    metrics_service.record('emails_sent', 2)
    metrics_service.record('active_users', 42)
    
    cache_service.set('user_preferences', { theme: 'dark', language: 'en' })
    const prefs = cache_service.get('user_preferences')
    
    console.log(`Current uptime: ${metrics_service.get_current_uptime()}ms`)
    
    // Wait a bit to see some processing and periodic cleanup
    console.log('\n--- Letting services run for a moment ---')
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    console.log('\n--- Platform Terminating (@OnTerminate methods) ---')
    await platform.terminate()
    
    console.log('\n=== Lifecycle methods example completed ===')
    console.log('Notice the order: Constructor → @OnStart → Service Usage → @OnTerminate')
}

if (require.main === module) {
    demonstrate_lifecycle_methods().catch(console.error)
} 