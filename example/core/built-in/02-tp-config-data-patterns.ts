import 'reflect-metadata'
import { load_config } from '@tarpit/config'
import { Platform, TpService, TpConfigData } from '@tarpit/core'

// Extend configuration schema with unique field names
declare module '@tarpit/core' {
    interface TpConfigSchema {
        app_debug: boolean
        email_service: {
            apiKey: string
            fromAddress: string
        }
        notification_features: {
            emailNotifications: boolean
            smsNotifications: boolean
            pushNotifications: boolean
        }
        cache_config: {
            provider: 'memory' | 'redis' | 'memcached'
        }
        redis_config: {
            host: string
            port: number
        }
        memcached_config: {
            servers: string[]
        }
        http_server: {
            port: number
            hostname: string
            cors: {
                enabled: boolean
                origin: string
            }
        }
    }
}

// Environment-Specific Behavior
@TpService()
class LoggerService {
    constructor(private config: TpConfigData) {}
    
    log(message: string) {
        const debug = this.config.get('app_debug') ?? false
        if (debug) {
            console.log(`[DEBUG] ${message}`)
        } else {
            // Production logging
            this.send_to_external_logger(message)
        }
    }
    
    private send_to_external_logger(message: string) {
        console.log(`[EXTERNAL] ${message}`)
    }
}

// Configuration Validation
@TpService()
class EmailService {
    constructor(private config: TpConfigData) {
        this.validate_config()
    }
    
    private validate_config() {
        const apiKey = this.config.get('email_service.apiKey')
        if (!apiKey) {
            throw new Error('Email API key is required')
        }
        
        const fromAddress = this.config.get('email_service.fromAddress')
        if (!fromAddress) {
            throw new Error('Email from address is required')
        }
        
        console.log('EmailService: Configuration validated successfully')
    }
    
    async send_email(to: string, subject: string, body: string) {
        const apiKey = this.config.get('email_service.apiKey')
        const fromAddress = this.config.get('email_service.fromAddress')
        console.log(`EmailService: Sending email from ${fromAddress} to ${to}`)
        console.log(`EmailService: Subject: ${subject}`)
        console.log(`EmailService: Using API key: ${apiKey.substring(0, 8)}...`)
        return { sent: true, messageId: 'msg-123' }
    }
}

// Feature Toggles
@TpService()
class NotificationService {
    constructor(private config: TpConfigData) {}
    
    async send_notification(message: string) {
        console.log('NotificationService: Processing notification...')
        
        const emailEnabled = this.config.get('notification_features.emailNotifications') ?? false
        if (emailEnabled) {
            await this.send_email_notification(message)
        }
        
        const smsEnabled = this.config.get('notification_features.smsNotifications') ?? false
        if (smsEnabled) {
            await this.send_sms_notification(message)
        }
        
        const pushEnabled = this.config.get('notification_features.pushNotifications') ?? false
        if (pushEnabled) {
            await this.send_push_notification(message)
        }
        
        console.log('NotificationService: All enabled notifications sent')
    }
    
    private async send_email_notification(message: string) {
        console.log(`NotificationService: Email notification: ${message}`)
    }
    
    private async send_sms_notification(message: string) {
        console.log(`NotificationService: SMS notification: ${message}`)
    }
    
    private async send_push_notification(message: string) {
        console.log(`NotificationService: Push notification: ${message}`)
    }
}

// Configuration-Based Service Selection
@TpService()
class CacheService {
    private cache_implementation: any
    
    constructor(private config: TpConfigData) {
        this.initialize_cache()
    }
    
    private initialize_cache() {
        const provider = this.config.get('cache_config.provider') ?? 'memory'
        console.log(`CacheService: Initializing ${provider} cache`)
        
        switch (provider) {
            case 'redis':
                const redisConfig = this.config.get('redis_config')
                this.cache_implementation = new RedisCache(redisConfig)
                break
            case 'memcached':
                const memcachedConfig = this.config.get('memcached_config')
                this.cache_implementation = new MemcachedCache(memcachedConfig)
                break
            default:
                this.cache_implementation = new InMemoryCache()
        }
    }
    
    async get(key: string): Promise<any> {
        return this.cache_implementation.get(key)
    }
    
    async set(key: string, value: any, ttl?: number): Promise<void> {
        return this.cache_implementation.set(key, value, ttl)
    }
}

// JSON Path Access Patterns
@TpService()
class HttpConfigService {
    constructor(private config: TpConfigData) {}
    
    get_server_config() {
        // Deep nested path access
        const port = this.config.get('http_server.port') ?? 3000
        const hostname = this.config.get('http_server.hostname') ?? 'localhost'
        const corsEnabled = this.config.get('http_server.cors.enabled') ?? false
        const corsOrigin = this.config.get('http_server.cors.origin') ?? '*'
        
        const serverConfig = {
            port,
            hostname,
            cors: {
                enabled: corsEnabled,
                origin: corsOrigin
            }
        }
        
        console.log('HttpConfigService: Server configuration:', serverConfig)
        return serverConfig
    }
    
    get_entire_http_config() {
        // Get entire http section
        const httpConfig = this.config.get('http_server')
        console.log('HttpConfigService: Entire HTTP config:', httpConfig)
        return httpConfig
    }
}

// Mock cache implementations
class InMemoryCache {
    private cache = new Map()
    
    async get(key: string) {
        console.log(`InMemoryCache: Getting ${key}`)
        return this.cache.get(key)
    }
    
    async set(key: string, value: any, ttl?: number) {
        console.log(`InMemoryCache: Setting ${key} = ${value}`)
        this.cache.set(key, value)
    }
}

class RedisCache {
    constructor(private config: any) {
        console.log(`RedisCache: Connecting to ${config.host}:${config.port}`)
    }
    
    async get(key: string) {
        console.log(`RedisCache: Getting ${key}`)
        return null // Mock
    }
    
    async set(key: string, value: any, ttl?: number) {
        console.log(`RedisCache: Setting ${key} = ${value}`)
    }
}

class MemcachedCache {
    constructor(private config: any) {
        console.log(`MemcachedCache: Connecting to servers:`, config.servers)
    }
    
    async get(key: string) {
        console.log(`MemcachedCache: Getting ${key}`)
        return null // Mock
    }
    
    async set(key: string, value: any, ttl?: number) {
        console.log(`MemcachedCache: Setting ${key} = ${value}`)
    }
}

async function main() {
    console.log('=== TpConfigData Configuration Patterns Example ===\n')
    
    // Load configuration with various patterns
    const config = load_config({
        app_debug: true,
        email_service: {
            apiKey: 'sk-1234567890abcdef',
            fromAddress: 'noreply@example.com'
        },
        notification_features: {
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: true
        },
        cache_config: {
            provider: 'redis' as const
        },
        redis_config: {
            host: 'localhost',
            port: 6379
        },
        memcached_config: {
            servers: ['localhost:11211']
        },
        http_server: {
            port: 3000,
            hostname: 'localhost',
            cors: {
                enabled: true,
                origin: '*'
            }
        }
    })
    
    // Create platform with all services
    const platform = new Platform(config)
        .import(LoggerService)
        .import(EmailService)
        .import(NotificationService)
        .import(CacheService)
        .import(HttpConfigService)
    
    // Start platform
    await platform.start()
    
    // Get services and demonstrate usage
    const logger = platform.expose(LoggerService)!
    const emailService = platform.expose(EmailService)!
    const notificationService = platform.expose(NotificationService)!
    const cacheService = platform.expose(CacheService)!
    const httpConfigService = platform.expose(HttpConfigService)!
    
    console.log('1. Environment-specific logging:')
    logger.log('This is a test message')
    
    console.log('\n2. Email service with validation:')
    await emailService.send_email('user@example.com', 'Test Subject', 'Test Body')
    
    console.log('\n3. Feature toggle notifications:')
    await notificationService.send_notification('Important system update')
    
    console.log('\n4. Configuration-based cache selection:')
    await cacheService.set('test-key', 'test-value')
    await cacheService.get('test-key')
    
    console.log('\n5. JSON path access patterns:')
    httpConfigService.get_server_config()
    httpConfigService.get_entire_http_config()
    
    // Terminate platform
    await platform.terminate()
    
    console.log('\n=== Example completed ===')
}

if (require.main === module) {
    main().catch(console.error)
} 