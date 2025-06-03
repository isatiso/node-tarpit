import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService, Inject, Optional, Disabled } from '@tarpit/core'

// Define custom tokens
const DATABASE_URL = Symbol('DATABASE_URL')
const MAX_RETRIES = Symbol('MAX_RETRIES')
const API_KEY = Symbol('API_KEY')

@TpService()
class LoggerService {
    log(message: string) {
        console.log(`[LOG] ${message}`)
    }
}

// Service demonstrating @Inject decorator
@TpService()
class DatabaseService {
    constructor(
        @Inject(DATABASE_URL) private url: string,
        @Inject(MAX_RETRIES) private max_retries: number,
        private logger: LoggerService  // Normal type-based injection
    ) {}
    
    connect() {
        this.logger.log(`Connecting to: ${this.url} (max retries: ${this.max_retries})`)
        return { success: true, connection_id: 'conn_123' }
    }
    
    query(sql: string) {
        this.logger.log(`Executing query: ${sql}`)
        return { rows: [], count: 0 }
    }
}

// Service demonstrating @Optional decorator
@TpService()
class EmailService {
    constructor(
        private logger: LoggerService,
        @Optional() @Inject(API_KEY) private api_key?: string,  // Optional with custom token
        @Optional() private metrics?: MetricsService            // Optional type-based injection
    ) {
        if (this.api_key) {
            this.logger.log('Email service initialized with API key')
        } else {
            this.logger.log('Email service initialized without API key - using fallback')
        }
    }
    
    send_email(to: string, subject: string) {
        this.logger.log(`Sending email to ${to}: ${subject}`)
        
        if (this.api_key) {
            console.log('Using premium email service (API key available)')
        } else {
            console.log('Using basic email service (no API key)')
        }
        
        // Metrics service might not be available
        this.metrics?.record_email_sent()
    }
}

// Optional service that may or may not be registered
@TpService()
class MetricsService {
    private email_count = 0
    
    record_email_sent() {
        this.email_count++
        console.log(`[METRICS] Emails sent: ${this.email_count}`)
    }
}

// Service demonstrating @Disabled decorator
@TpService()
class FileService {
    constructor(
        private logger: LoggerService,
        @Disabled() private base_dir: string = '/tmp',          // Not injected, uses default
        @Disabled() private max_file_size: number = 1024 * 1024, // Not injected, uses default
        @Optional() @Inject(DATABASE_URL) private backup_url?: string  // Optional injection
    ) {
        this.logger.log(`FileService initialized with base_dir: ${this.base_dir}`)
    }
    
    save_file(filename: string, content: string) {
        this.logger.log(`Saving file ${filename} to ${this.base_dir}`)
        
        if (content.length > this.max_file_size) {
            throw new Error(`File too large: ${content.length} > ${this.max_file_size}`)
        }
        
        if (this.backup_url) {
            this.logger.log(`Also backing up to: ${this.backup_url}`)
        }
        
        return { path: `${this.base_dir}/${filename}`, size: content.length }
    }
}

async function demonstrate_parameter_decorators() {
    console.log('=== Parameter Decorators Example ===')
    
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
        // Register values for @Inject tokens
        .import({ provide: DATABASE_URL, useValue: 'postgresql://localhost:5432/mydb' })
        .import({ provide: MAX_RETRIES, useValue: 3 })
        // Note: API_KEY is not registered - will be undefined in @Optional injection
        
        // Register services
        .import(LoggerService)
        .import(DatabaseService)
        .import(EmailService)
        .import(FileService)
        // Note: MetricsService is registered - will be available for @Optional injection
        .import(MetricsService)
    
    await platform.start()
    
    console.log('\n1. Testing @Inject decorator:')
    const db_service = platform.expose(DatabaseService)
    if (!db_service) {
        throw new Error('DatabaseService not found')
    }
    
    db_service.connect()
    db_service.query('SELECT * FROM users')
    
    console.log('\n2. Testing @Optional decorator:')
    const email_service = platform.expose(EmailService)
    if (!email_service) {
        throw new Error('EmailService not found')
    }
    
    email_service.send_email('user@example.com', 'Welcome!')
    
    console.log('\n3. Testing @Disabled decorator:')
    const file_service = platform.expose(FileService)
    if (!file_service) {
        throw new Error('FileService not found')
    }
    
    file_service.save_file('test.txt', 'Hello, world!')
    
    console.log('\n4. Testing with different configuration (API_KEY provided):')
    
    // Create second platform with API_KEY
    const platform2 = new Platform(config)
        .import({ provide: DATABASE_URL, useValue: 'postgresql://localhost:5432/mydb' })
        .import({ provide: MAX_RETRIES, useValue: 3 })
        .import({ provide: API_KEY, useValue: 'sk-1234567890abcdef' })  // API key provided
        .import(LoggerService)
        .import(EmailService)
        // Note: MetricsService not registered - will be undefined
    
    await platform2.start()
    
    const email_service2 = platform2.expose(EmailService)
    if (email_service2) {
        email_service2.send_email('premium@example.com', 'Premium service!')
    }
    
    await platform.terminate()
    await platform2.terminate()
    console.log('\n=== Parameter decorators example completed ===')
}

if (require.main === module) {
    demonstrate_parameter_decorators().catch(console.error)
} 