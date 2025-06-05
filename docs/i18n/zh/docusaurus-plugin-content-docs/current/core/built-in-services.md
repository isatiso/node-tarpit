---
sidebar_position: 5
---

# 内置服务

Tarpit 提供几个内置服务，在每个应用程序中都自动可用。最重要的内置服务是用于配置访问的 **TpConfigData** 和用于生命周期管理的 **TpLoader**。

## TpConfigData

TpConfigData 提供对平台初始化期间加载的应用程序配置的访问。它会自动注入并通过 Tarpit 特定功能扩展 ConfigData。

### 基本用法

:::info 完整示例
[example/core/built-in/01-tp-config-data-basic.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/built-in/01-tp-config-data-basic.ts)
:::

```typescript
import { TpService, TpConfigData } from '@tarpit/core'

@TpService()
class DatabaseService {
    constructor(private config: TpConfigData) {}
    
    connect() {
        // 使用 JSON 路径表示法访问配置
        const host = this.config.get('database.host') ?? 'localhost'
        const port = this.config.get('database.port') ?? 5432
        console.log(`Connecting to database: ${host}:${port}`)
    }
}
```

### 类型化配置

扩展 TpConfigSchema 来定义你的配置结构：

```typescript
// 扩展全局 TpConfigSchema 接口
declare module '@tarpit/core' {
    interface TpConfigSchema {
        database: {
            host: string
            port: number
            name: string
        }
        redis: {
            host: string
            port: number
        }
        debug: boolean
    }
}

@TpService()
class DatabaseService {
    constructor(private config: TpConfigData) {}
    
    connect() {
        // 使用路径时，TypeScript 知道配置的确切形状
        const host = this.config.get('database.host')
        const port = this.config.get('database.port')
        const name = this.config.get('database.name')
        console.log(`Connecting to ${host}:${port}/${name}`)
    }
    
    get_full_database_config() {
        // 获取整个数据库部分
        const dbConfig = this.config.get('database')
        return dbConfig
    }
    
    get_all_config() {
        // 获取整个配置对象
        return this.config.get()
    }
}
```

### 配置模式

:::info 完整示例
[example/core/built-in/02-tp-config-data-patterns.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/built-in/02-tp-config-data-patterns.ts)
:::

#### 特定环境行为

```typescript
@TpService()
class LoggerService {
    constructor(private config: TpConfigData) {}
    
    log(message: string) {
        const debug = this.config.get('debug') ?? false
        if (debug) {
            console.log(`[DEBUG] ${message}`)
        } else {
            // 生产环境日志记录
            this.send_to_external_logger(message)
        }
    }
    
    private send_to_external_logger(message: string) {
        // 发送到外部日志服务
    }
}
```

#### 配置验证

```typescript
@TpService()
class EmailService {
    constructor(private config: TpConfigData) {
        this.validate_config()
    }
    
    private validate_config() {
        const apiKey = this.config.get('email.apiKey')
        if (!apiKey) {
            throw new Error('Email API key is required')
        }
        
        const fromAddress = this.config.get('email.fromAddress')
        if (!fromAddress) {
            throw new Error('Email from address is required')
        }
    }
    
    async send_email(to: string, subject: string, body: string) {
        const apiKey = this.config.get('email.apiKey')
        const fromAddress = this.config.get('email.fromAddress')
        // 使用 apiKey 和 fromAddress 的邮件发送逻辑
    }
}
```

#### 功能开关

```typescript
@TpService()
class NotificationService {
    constructor(private config: TpConfigData) {}
    
    async send_notification(message: string) {
        const emailEnabled = this.config.get('features.emailNotifications') ?? false
        if (emailEnabled) {
            await this.send_email_notification(message)
        }
        
        const smsEnabled = this.config.get('features.smsNotifications') ?? false
        if (smsEnabled) {
            await this.send_sms_notification(message)
        }
        
        const pushEnabled = this.config.get('features.pushNotifications') ?? false
        if (pushEnabled) {
            await this.send_push_notification(message)
        }
    }
    
    private async send_email_notification(message: string) {
        // 邮件通知逻辑
    }
    
    private async send_sms_notification(message: string) {
        // 短信通知逻辑
    }
    
    private async send_push_notification(message: string) {
        // 推送通知逻辑
    }
}
```

#### 基于配置的服务选择

```typescript
@TpService()
class CacheService {
    private cache_implementation: any
    
    constructor(private config: TpConfigData) {
        this.initialize_cache()
    }
    
    private initialize_cache() {
        const provider = this.config.get('cache.provider') ?? 'memory'
        
        switch (provider) {
            case 'redis':
                const redisConfig = this.config.get('redis')
                this.cache_implementation = new RedisCache(redisConfig)
                break
            case 'memcached':
                const memcachedConfig = this.config.get('memcached')
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
```

#### JSON 路径访问模式

```typescript
@TpService()
class HttpConfigService {
    constructor(private config: TpConfigData) {}
    
    get_server_config() {
        // 深度嵌套路径访问
        const port = this.config.get('http.port') ?? 3000
        const hostname = this.config.get('http.hostname') ?? 'localhost'
        const corsEnabled = this.config.get('http.cors.enabled') ?? false
        const corsOrigin = this.config.get('http.cors.origin') ?? '*'
        
        return {
            port,
            hostname,
            cors: {
                enabled: corsEnabled,
                origin: corsOrigin
            }
        }
    }
    
    get_entire_http_config() {
        // 获取整个 http 部分
        return this.config.get('http')
    }
}
```

## TpLoader

TpLoader 管理应用程序生命周期，并为初始化和清理操作提供钩子。它对于正确处理启动和关闭序列至关重要。

### 使用装饰器的生命周期钩子（推荐）

:::info 完整示例
[example/core/built-in/03-tp-loader-decorators.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/built-in/03-tp-loader-decorators.ts)
:::

注册生命周期钩子的首选方法是使用装饰器：

```typescript
import { TpService, OnStart, OnTerminate } from '@tarpit/core'

@TpService()
class DatabaseService {
    private connection: any
    
    @OnStart()
    async initialize() {
        console.log('Initializing database connection')
        this.connection = await this.create_database_connection()
    }
    
    @OnTerminate()
    async cleanup() {
        console.log('Closing database connection')
        if (this.connection) {
            await this.connection.close()
        }
    }
    
    private async create_database_connection() {
        // 数据库连接逻辑
        return { close: async () => {} } // 模拟连接
    }
}
```

### 复杂的初始化和清理

当你需要在启动或关闭期间执行多个操作时，将它们组织在生命周期方法中：

```typescript
@TpService()
class ApplicationService {
    private data: any[] = []
    private background_tasks: any[] = []
    private monitoring_tools: any[] = []
    
    @OnStart()
    async initialize() {
        console.log('Starting application initialization...')
        
        // 加载初始数据
        await this.load_initial_data()
        
        // 启动后台任务
        await this.start_background_tasks()
        
        // 初始化监控
        await this.initialize_monitoring()
        
        console.log('Application initialization completed')
    }
    
    @OnTerminate()
    async cleanup() {
        console.log('Starting application cleanup...')
        
        // 保存应用程序状态
        await this.save_application_state()
        
        // 停止后台任务
        await this.stop_background_tasks()
        
        // 清理资源
        await this.cleanup_resources()
        
        console.log('Application cleanup completed')
    }
    
    private async load_initial_data() {
        console.log('Loading initial application data')
        this.data = await this.fetch_initial_data()
    }
    
    private async start_background_tasks() {
        console.log('Starting background tasks')
        this.background_tasks = await this.initialize_workers()
    }
    
    private async initialize_monitoring() {
        console.log('Initializing monitoring and health checks')
        this.monitoring_tools = await this.setup_monitoring()
    }
    
    private async save_application_state() {
        console.log('Saving application state')
        await this.persist_data()
    }
    
    private async stop_background_tasks() {
        console.log('Stopping background tasks')
        for (const task of this.background_tasks) {
            await task.stop()
        }
        this.background_tasks = []
    }
    
    private async cleanup_resources() {
        console.log('Cleaning up resources')
        for (const tool of this.monitoring_tools) {
            await tool.cleanup()
        }
        this.monitoring_tools = []
    }
    
    private async fetch_initial_data() {
        // 数据加载逻辑
        return []
    }
    
    private async initialize_workers() {
        // 工作器初始化
        return []
    }
    
    private async setup_monitoring() {
        // 监控设置
        return []
    }
    
    private async persist_data() {
        // 数据持久化逻辑
    }
}
```

### 资源管理模式

```typescript
@TpService()
class ResourceManager {
    private database_connections: any[] = []
    private cache_connections: any[] = []
    private background_processes: any[] = []
    
    @OnStart()
    async initialize() {
        console.log('Initializing all resources...')
        
        await this.initialize_database()
        await this.initialize_cache()
        await this.start_background_processes()
        
        console.log('All resources initialized successfully')
    }
    
    @OnTerminate()
    async cleanup() {
        console.log('Cleaning up all resources...')
        
        // 首先停止后台进程
        await this.stop_background_processes()
        
        // 然后关闭连接
        await this.cleanup_connections()
        
        console.log('All resources cleaned up successfully')
    }
    
    private async initialize_database() {
        console.log('Initializing database connections')
        const connection = await this.create_database_connection()
        this.database_connections.push(connection)
    }
    
    private async initialize_cache() {
        console.log('Initializing cache connections')
        const connection = await this.create_cache_connection()
        this.cache_connections.push(connection)
    }
    
    private async start_background_processes() {
        console.log('Starting background processes')
        const data_processor = this.start_data_processor()
        const health_checker = this.start_health_checker()
        this.background_processes.push(data_processor, health_checker)
    }
    
    private async stop_background_processes() {
        console.log('Stopping background processes')
        for (const process of this.background_processes) {
            await process.stop()
        }
        this.background_processes = []
    }
    
    private async cleanup_connections() {
        console.log('Closing all connections')
        
        // 关闭缓存连接
        for (const connection of this.cache_connections) {
            await connection.close()
        }
        
        // 关闭数据库连接
        for (const connection of this.database_connections) {
            await connection.close()
        }
        
        this.cache_connections = []
        this.database_connections = []
    }
    
    private async create_database_connection() {
        return { close: async () => {} } // 模拟
    }
    
    private async create_cache_connection() {
        return { close: async () => {} } // 模拟
    }
    
    private start_data_processor() {
        return { stop: async () => {} } // 模拟
    }
    
    private start_health_checker() {
        return { stop: async () => {} } // 模拟
    }
}
```

### 高级：直接使用 TpLoader

:::info 完整示例
[example/core/built-in/04-tp-loader-advanced.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/built-in/04-tp-loader-advanced.ts)
:::

对于需要更多钩子注册控制的高级场景，你可以直接注入 TpLoader：

```typescript
import { TpService, TpLoader } from '@tarpit/core'

@TpService()
class AdvancedService {
    constructor(private loader: TpLoader) {
        // 仅在装饰器不足时使用此方法
        // 例如，当条件性地注册钩子时
        this.register_conditional_hooks()
    }
    
    private register_conditional_hooks() {
        // 基于配置的条件钩子注册
        if (this.should_enable_feature()) {
            this.loader.on_start(this.initialize_feature.bind(this))
            this.loader.on_terminate(this.cleanup_feature.bind(this))
        }
        
        // 循环中的动态钩子注册
        for (let i = 0; i < 3; i++) {
            this.loader.on_start(async () => {
                console.log(`Dynamic hook ${i}`)
            })
        }
    }
    
    private should_enable_feature(): boolean {
        // 某些条件检查
        return true
    }
    
    private async initialize_feature() {
        console.log('Initializing conditional feature')
    }
    
    private async cleanup_feature() {
        console.log('Cleaning up conditional feature')
    }
}
```

### 钩子执行顺序

:::info 完整示例
[example/core/built-in/05-hook-execution-order.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/built-in/05-hook-execution-order.ts)
:::

生命周期钩子按服务注册的顺序触发，但实际的执行完成顺序取决于各个钩子的实现：

```typescript
@TpService()
class ServiceA {
    @OnStart()
    async initialize() {
        console.log('ServiceA: Starting initialization')
        // 快速操作
        await new Promise(resolve => setTimeout(resolve, 100))
        console.log('ServiceA: Initialization completed')
    }
    
    @OnTerminate()
    async cleanup() {
        console.log('ServiceA: Starting cleanup')
        await new Promise(resolve => setTimeout(resolve, 100))
        console.log('ServiceA: Cleanup completed')
    }
}

@TpService()
class ServiceB {
    @OnStart()
    async initialize() {
        console.log('ServiceB: Starting initialization')
        // 慢操作
        await new Promise(resolve => setTimeout(resolve, 500))
        console.log('ServiceB: Initialization completed')
    }
    
    @OnTerminate()
    async cleanup() {
        console.log('ServiceB: Starting cleanup')
        await new Promise(resolve => setTimeout(resolve, 500))
        console.log('ServiceB: Cleanup completed')
    }
}

// 在启动期间，触发顺序是保证的：
// ServiceA: Starting initialization
// ServiceB: Starting initialization
//
// 但完成顺序取决于异步操作：
// ServiceA: Initialization completed  (由于延迟较短先完成)
// ServiceB: Initialization completed  (由于延迟较长后完成)

// 在关闭期间，行为相同：
// ServiceA: Starting cleanup
// ServiceB: Starting cleanup
// ServiceA: Cleanup completed
// ServiceB: Cleanup completed
```

:::warning 钩子执行行为
- **触发顺序**: 保证遵循服务注册顺序
- **完成顺序**: 不保证 - 取决于每个钩子的执行时间
- **错误处理**: 如果一个钩子失败，其他钩子继续执行
- **无依赖性**: 钩子独立运行，不等待彼此
:::

如果你需要保证顺序执行，请在单个服务内处理或在服务之间使用显式依赖。

## 下一步

- [**依赖注入**](./dependency-injection) - 回顾 DI 基础知识
- [**平台与生命周期**](./platform-lifecycle) - 了解应用程序生命周期
- [**提供者**](./providers) - 了解不同的提供者类型 