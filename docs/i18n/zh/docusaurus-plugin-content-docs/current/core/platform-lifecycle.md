---
sidebar_position: 2
---

# 平台与生命周期

:::info 工作示例
查看 [平台示例](https://github.com/isatiso/node-tarpit/blob/main/example/core/platform/) 获取完整的工作示例。
:::

Platform 类是每个 Tarpit 应用程序的核心。它管理依赖注入容器，处理模块导入，并控制从启动到关闭的应用程序生命周期。

## 平台概述

Platform 充当：

- **DI 容器管理器** - 创建和管理依赖注入系统
- **模块编排器** - 处理模块导入和依赖解析
- **生命周期管理器** - 控制应用程序启动、运行和关闭阶段
- **服务注册表** - 所有服务和提供者的中央注册表

## 基本平台用法

### 创建平台

:::info 完整示例
[example/core/platform/01-basic-usage.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/platform/01-basic-usage.ts)
:::

```typescript
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema } from '@tarpit/core'

const config = load_config<TpConfigSchema>({
    name: 'my-app',
    version: '1.0.0',
    debug: process.env.NODE_ENV === 'development'
})

const platform = new Platform(config)
```

### 导入模块和服务

```typescript
import { UserService, UserModule } from './user'
import { DatabaseService } from './database'
import { EmailService, NotificationService } from './services'

const platform = new Platform(config)
    .import(DatabaseService)      // 导入单个服务
    .import(UserModule)           // 导入整个模块
    .import(EmailService)         // 逐个导入每个服务
    .import(NotificationService)  // import() 不支持数组
```

### 启动应用程序

```typescript
// 启动平台
await platform.start()

// 启动后访问服务
const userService = platform.expose(UserService)
const result = userService.create_user('Alice')
```

## 平台配置

### 理解 TpConfigSchema 和声明合并

`TpConfigSchema` 是 Tarpit 配置系统的核心。它使用 TypeScript 的**声明合并**功能自动组合来自所有加载模块的配置类型。

:::info 为什么以 HTTP 模块作为示例
我们使用 `@tarpit/http` 作为主要示例，因为：
- 它是最常用的 Tarpit 模块之一
- 它提供清晰、实用的配置选项（端口、主机名、CORS）
- 它演示了基本概念而不复杂
- 大多数开发者都熟悉 HTTP 服务器配置
:::

#### 基础 TpConfigSchema（空的）

基础的 `TpConfigSchema` 开始时是空的，由模块扩展：

```typescript
import { load_config } from '@tarpit/config'
import { TpConfigSchema } from '@tarpit/core'

// 基础 TpConfigSchema 没有预定义字段
interface TpConfigSchema {
    // 空的 - 由导入的模块扩展
}

// 没有任何模块时，没有可用的配置字段
const config = load_config<TpConfigSchema>({
    // 基础 TpConfigSchema 中没有可用字段
})

const platform = new Platform(config)
```

#### 添加 HTTP 模块配置

当你导入 `@tarpit/http` 时，它会自动扩展 `TpConfigSchema`：

```typescript
import { Platform, TpConfigSchema } from '@tarpit/core'
import '@tarpit/http'  // 这个导入扩展了 TpConfigSchema

// 现在 TpConfigSchema 包含 HTTP 配置选项
const config = load_config<TpConfigSchema>({
    http: {
        port: 3000,
        hostname: '0.0.0.0',
        cors: {
            enabled: true,
            origin: '*'
        }
    }
})

const platform = new Platform(config)
```

#### HTTP 模块如何扩展配置

在幕后，`@tarpit/http` 使用声明合并：

```typescript
// 在 @tarpit/http 模块内部
declare module '@tarpit/core' {
    interface TpConfigSchema {
        http?: {
            port?: number
            hostname?: string
            cors?: {
                enabled?: boolean
                origin?: string | string[]
                credentials?: boolean
            }
        }
    }
}
```

#### 类型安全和智能提示

声明合并提供完整的 TypeScript 支持：

```typescript
import { Platform, TpConfigSchema } from '@tarpit/core'
import '@tarpit/http'

const config = load_config<TpConfigSchema>({
    http: {
        port: 3000,           // ✅ TypeScript 知道这应该是 number
        // port: '3000',      // ❌ TypeScript 错误：应该是 number
        hostname: '0.0.0.0',
        cors: {
            enabled: true,
            origin: ['http://localhost:3000', 'https://myapp.com']
            // origin: 123     // ❌ TypeScript 错误：应该是 string | string[]
        }
    }
})

const platform = new Platform(config)
```

### 基于环境的配置

:::info 完整示例
[example/core/platform/02-configuration.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/platform/02-configuration.ts)
:::

使用环境变量的实用配置模式：

```typescript
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema } from '@tarpit/core'
import '@tarpit/http'

const config = load_config<TpConfigSchema>({
    http: {
        port: parseInt(process.env.PORT || '3000'),
        hostname: process.env.HOST || '0.0.0.0',
        cors: {
            enabled: process.env.CORS_ENABLED !== 'false',
            origin: process.env.CORS_ORIGIN?.split(',') || '*',
            credentials: process.env.CORS_CREDENTIALS === 'true'
        }
    }
})

const platform = new Platform(config)
    .import(HttpModule)  // HTTP 模块将使用配置
```

### 多模块配置

当导入多个模块时，它们的配置会自动合并：

```typescript
import { Platform, TpConfigSchema } from '@tarpit/core'
import '@tarpit/http'
import '@tarpit/mongodb'

const config = load_config<TpConfigSchema>({
    // HTTP 配置（来自 @tarpit/http）
    http: {
        port: 3000,
        cors: { enabled: true }
    },
    
    // MongoDB 配置（来自 @tarpit/mongodb）
    mongodb: {
        url: 'mongodb://localhost:27017',
        database: 'myapp',
        options: {
            maxPoolSize: 10
        }
    }
})

const platform = new Platform(config)
```

### 自定义配置扩展

你可以为自己的应用程序需求扩展配置：

```typescript
// 为你的应用程序扩展 TpConfigSchema
declare module '@tarpit/core' {
    interface TpConfigSchema {
        database?: {
            url?: string
            poolSize?: number
        }
        features?: {
            emailEnabled?: boolean
            analyticsEnabled?: boolean
        }
    }
}

const config = load_config<TpConfigSchema>({
    // HTTP 模块配置
    http: {
        port: 3000
    },
    
    // 你的自定义配置
    database: {
        url: process.env.DATABASE_URL || 'postgresql://localhost:5432/myapp',
        poolSize: parseInt(process.env.DB_POOL_SIZE || '10')
    },
    
    features: {
        emailEnabled: process.env.EMAIL_ENABLED === 'true',
        analyticsEnabled: true
    }
})
```

### 服务中的配置访问

服务通过 `TpConfigData` 使用 JSON 路径表示法的 `get()` 方法访问配置：

```typescript
import { TpService, TpConfigData } from '@tarpit/core'

@TpService()
class HttpConfigService {
    
    constructor(private config: TpConfigData) {}
    
    get_server_port() {
        // 使用 JSON 路径访问嵌套配置
        return this.config.get('http.port') ?? 3000
    }
    
    get_cors_origin() {
        return this.config.get('http.cors.origin') ?? '*'
    }
    
    is_cors_enabled() {
        return this.config.get('http.cors.enabled') === true
    }
    
    get_file_manager_root() {
        return this.config.get('http.file_manager.root') ?? './data'
    }
}
```

#### JSON 路径配置访问

`get()` 方法支持使用点符号的深度嵌套路径访问：

```typescript
@TpService()
class DatabaseConfigService {
    
    constructor(private config: TpConfigData) {}
    
    get_connection_config() {
        // 访问 MongoDB 配置
        const url = this.config.get('mongodb.url')
        const options = this.config.get('mongodb.options')
        const database = this.config.get('mongodb.database')
        
        return { url, options, database }
    }
    
    // 自定义配置访问
    get_database_pool_size() {
        return this.config.get('database.poolSize') ?? 10
    }
    
    get_feature_flags() {
        return {
            emailEnabled: this.config.get('features.emailEnabled') ?? false,
            analyticsEnabled: this.config.get('features.analyticsEnabled') ?? false
        }
    }
}
```

#### 完整配置访问

访问整个配置对象：

```typescript
@TpService()
class ConfigurationService {
    
    constructor(private config: TpConfigData) {}
    
    log_all_configuration() {
        // 不带路径获取整个配置
        const fullConfig = this.config.get()
        console.log('Complete configuration:', fullConfig)
        return fullConfig
    }
    
    log_specific_sections() {
        // 访问特定配置部分
        const httpConfig = this.config.get('http')
        const mongoConfig = this.config.get('mongodb')
        const customConfig = this.config.get('database')
        
        console.log('HTTP Configuration:', httpConfig)
        console.log('MongoDB Configuration:', mongoConfig)
        console.log('Custom Database Configuration:', customConfig)
    }
}
```

#### 类型安全的配置访问

`get()` 方法基于配置模式提供完整的 TypeScript 类型推断：

```typescript
// 扩展配置模式
declare module '@tarpit/core' {
    interface TpConfigSchema {
        database?: {
            url?: string
            poolSize?: number
        }
        features?: {
            emailEnabled?: boolean
            analyticsEnabled?: boolean
        }
    }
}

@TpService()
class TypeSafeConfigService {
    
    constructor(private config: TpConfigData) {}
    
    initialize() {
        // TypeScript 为这些路径提供完整的智能提示
        const httpPort = this.config.get('http.port')              // number | undefined
        const corsOrigin = this.config.get('http.cors.origin')     // string | string[] | undefined
        const dbUrl = this.config.get('database.url')              // string | undefined
        const emailEnabled = this.config.get('features.emailEnabled') // boolean | undefined
        
        // 使用默认值
        const port = this.config.get('http.port') ?? 3000
        const poolSize = this.config.get('database.poolSize') ?? 10
        
        console.log(`Server starting on port ${port} with pool size ${poolSize}`)
    }
}
```

### 配置优势

声明合并配置系统提供：

1. **类型安全** - 对所有配置选项进行完整的 TypeScript 检查
2. **自动扩展** - 模块自动贡献其配置
3. **智能提示支持** - 在 IDE 中完整的自动完成
4. **环境集成** - 与环境变量轻松集成
5. **模块化设计** - 配置随应用程序模块增长

## 平台方法

:::info 完整示例
[example/core/platform/03-platform-methods.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/platform/03-platform-methods.ts)
:::

### .import()

导入服务、模块或提供者：

```typescript
// 导入服务类
platform.import(UserService)

// 导入模块
platform.import(UserModule)

// 使用自定义提供者导入
platform.import({
    provide: DATABASE_URL,
    useValue: 'postgresql://localhost:5432'
})

// 导入工厂提供者
platform.import({
    provide: ApiClient,
    useFactory: (config: TpConfigData) => new ApiClient(config.api.baseUrl),
    deps: [TpConfigData]
})
```

### .start()

启动平台并初始化所有服务：

```typescript
// 简单启动
await platform.start()

// start 返回平台以支持链式调用
const runningPlatform = await platform.start()

// 带错误处理
try {
    await platform.start()
    console.log('Platform started successfully')
} catch (error) {
    console.error('Failed to start platform:', error)
    
    // 平台在启动失败时自动清理
    // 无需手动调用 terminate()
    
    // 记录特定错误详情
    if (error.message.includes('dependency')) {
        console.error('Dependency injection error - check your service dependencies')
    } else if (error.message.includes('configuration')) {
        console.error('Configuration error - check your config values')
    }
    
    process.exit(1)
}
```

### .expose()

从平台获取服务实例：

```typescript
// 获取服务实例
const userService = platform.expose(UserService)

// 使用自定义标记
const dbUrl = platform.expose(DATABASE_URL)

// 检查服务是否存在（如果未找到返回 undefined）
const optionalService = platform.expose(OptionalService)
if (optionalService) {
    optionalService.doSomething()
}
```

### .terminate()

优雅地关闭平台：

```typescript
// 关闭平台
await platform.terminate()

// 带错误处理
try {
    await platform.terminate()
    console.log('Platform terminated successfully')
} catch (error) {
    console.error('Error during platform termination:', error)
}
```

### .inspect_injector()

调试依赖注入层次结构：

```typescript
// 在使用任何服务之前
console.log('=== Provider Tree (Before) ===')
console.log(platform.inspect_injector())

// 启动平台后
await platform.start()

// 使用一些服务
const userService = platform.expose(UserService)
const dbService = platform.expose(DatabaseService)

// 打印依赖树
console.log('=== Provider Tree (After) ===')
console.log(platform.inspect_injector())

// 调试的示例输出：
// Injector
// ├── ○ TpConfigData [Built-in]
// ├── ✓ TpLoader [Built-in]
// ├── ✓ DatabaseService [TpWorker → @TpService]
// ├── ○ CacheService [TpWorker → @TpService]
// ├── ✓ UserService [TpWorker → @TpService]
// └── Injector (UserModule)
//     ├── ○ UserRepository [TpWorker → @TpService]
//     ├── ○ UserValidator [TpWorker → @TpService]
//     └── ✓ UserModule [TpAssembly → @TpModule]
```

#### 使用状态分析

使用指示器有助于识别：
- **✓ 已使用的服务** - 这些已被实例化并处于活动状态
- **○ 未使用的服务** - 这些已注册但尚不需要
- **性能优化** - 移除未使用的服务以减少启动时间
- **依赖跟踪** - 了解哪些服务触发其他服务

## 应用程序生命周期

Platform 管理从启动到关闭的完整应用程序生命周期，为服务提供参与每个阶段的钩子。

### 生命周期阶段

#### 启动阶段

在启动期间，平台：

1. **加载配置** - 处理提供的配置
2. **创建 DI 容器** - 设置依赖注入系统
3. **注册提供者** - 注册所有导入的服务和模块
4. **解析依赖项** - 创建实例并注入依赖项
5. **调用启动钩子** - 触发服务上的 `on_start` 方法

#### 运行阶段

启动后，平台：

- **管理服务实例** - 跟踪所有创建的服务
- **处理服务解析** - 通过 `.expose()` 提供服务
- **监控生命周期** - 管理持续操作

#### 关闭阶段

在终止期间，平台：

1. **调用清理钩子** - 触发 `on_terminate` 方法
2. **释放资源** - 释放内存和连接
3. **关闭连接** - 关闭数据库、网络连接
4. **清理 DI 容器** - 清除所有服务实例

### 服务生命周期钩子

:::info 完整示例
[example/core/platform/04-lifecycle-hooks.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/platform/04-lifecycle-hooks.ts)
:::

服务可以实现生命周期钩子来管理其初始化和清理。这些钩子在相应的生命周期阶段由平台自动调用。

#### 启动钩子：@OnStart

在服务需要初始化的启动阶段调用：

```typescript
import { TpService, OnStart } from '@tarpit/core'

@TpService()
class DatabaseService {
    private isConnected = false
    
    @OnStart()
    async initialize() {
        console.log('DatabaseService: Starting connection...')
        await this.connect()
        this.isConnected = true
        console.log('DatabaseService: Connected successfully')
    }
    
    private async connect() {
        // 数据库连接逻辑
        await new Promise(resolve => setTimeout(resolve, 1000))
    }
}
```

#### 清理钩子：@OnTerminate

在服务需要清理的关闭阶段调用：

```typescript
import { TpService, OnTerminate } from '@tarpit/core'

@TpService()
class DatabaseService {
    private connections: Connection[] = []
    
    @OnTerminate()
    async cleanup() {
        console.log('DatabaseService: Closing connections...')
        
        // 关闭所有连接
        await Promise.all(
            this.connections.map(conn => conn.close())
        )
        
        console.log('DatabaseService: All connections closed')
    }
}
```

#### 完整生命周期示例

使用启动和清理钩子的服务：

```typescript
@TpService()
class CacheService {
    private cache = new Map<string, any>()
    private cleanupInterval?: NodeJS.Timeout
    
    @OnStart()
    async initialize() {
        console.log('CacheService: Initializing cache...')
        await this.load_initial_data()
        
        // 设置定期清理
        this.cleanupInterval = setInterval(() => {
            this.cleanup_expired_entries()
        }, 60000)
        
        console.log('CacheService: Cache initialized')
    }
    
    @OnTerminate()
    async cleanup() {
        console.log('CacheService: Shutting down...')
        
        try {
            // 清除清理间隔
            if (this.cleanupInterval) {
                clearInterval(this.cleanupInterval)
            }
            
            // 如需要，将缓存保存到持久存储
            await this.persist_cache_data()
            
            // 清除缓存
            this.cache.clear()
            
            console.log('CacheService: Shutdown complete')
        } catch (error) {
            console.error('CacheService: Error during cleanup:', error)
            // 不抛出 - 允许其他服务终止
        }
    }
    
    private async load_initial_data() {
        // 加载初始缓存数据
    }
    
    private cleanup_expired_entries() {
        // 移除过期的缓存条目
    }
    
    private async persist_cache_data() {
        // 关闭前保存缓存数据
    }
}
```

## 调试和监控

:::info 完整示例
[example/core/platform/05-debugging-monitoring.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/platform/05-debugging-monitoring.ts)
:::

### 提供者树可视化

使用 `.inspect_injector()` 调试依赖注入：

```typescript
// 在使用任何服务之前
console.log('=== Provider Tree (Before) ===')
console.log(platform.inspect_injector())

// 启动平台后
await platform.start()

// 使用一些服务
const userService = platform.expose(UserService)
const dbService = platform.expose(DatabaseService)

// 打印依赖树
console.log('=== Provider Tree (After) ===')
console.log(platform.inspect_injector())

// 调试的示例输出：
// Injector
// ├── ○ TpConfigData [Built-in]
// ├── ✓ TpLoader [Built-in]
// ├── ✓ DatabaseService [TpWorker → @TpService]
// ├── ○ CacheService [TpWorker → @TpService]
// ├── ✓ UserService [TpWorker → @TpService]
// └── Injector (UserModule)
//     ├── ○ UserRepository [TpWorker → @TpService]
//     ├── ○ UserValidator [TpWorker → @TpService]
//     └── ✓ UserModule [TpAssembly → @TpModule]
```

#### 使用状态分析

使用指示器有助于识别：
- **✓ 已使用的服务** - 这些已被实例化并处于活动状态
- **○ 未使用的服务** - 这些已注册但尚不需要
- **性能优化** - 移除未使用的服务以减少启动时间
- **依赖跟踪** - 了解哪些服务触发其他服务

### 内置性能监控

Platform 自动跟踪启动和关闭时间：

```typescript
// 启动平台 - 返回启动时间（秒）
const startupTime = await platform.start()
console.log(`Platform started in ${startupTime}s`)

// 访问计时属性
console.log('Started at:', platform.started_at)  // 时间戳
console.log('Startup duration:', platform.start_time)  // 秒

// 终止平台 - 返回关闭时间（秒）
const shutdownTime = await platform.terminate()
console.log(`Platform terminated in ${shutdownTime}s`)

// 访问关闭计时
console.log('Terminated at:', platform.terminated_at)  // 时间戳
console.log('Shutdown duration:', platform.terminate_time)  // 秒
```

Platform 还自动记录计时信息：
```
Tarpit server started at 2023-12-01T10:30:45.123Z, during 0.234s
Tarpit server destroyed at 2023-12-01T10:35:20.456Z, during 0.067s
```

## 最佳实践

:::info 完整示例
[example/core/platform/06-best-practices.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/platform/06-best-practices.ts)
:::

### 1. 正确使用平台配置

始终使用 TpConfigSchema 模式进行可配置行为：

```typescript
// ✅ 好 - 正确的平台配置
const config = load_config<TpConfigSchema>({
    http: {
        port: parseInt(process.env.PORT || '3000'),
        hostname: process.env.HOST || '0.0.0.0'
    },
    // 根据需要添加其他模块配置
})

const platform = new Platform(config)
```

在服务中使用 TpConfigData 访问配置：

```typescript
@TpService()
class ApiService {
    constructor(private config: TpConfigData) {}
    
    get_base_url() {
        const port = this.config.get('http.port') ?? 3000
        const hostname = this.config.get('http.hostname') ?? 'localhost'
        return `http://${hostname}:${port}/api`
    }
}
```

### 2. 实现生命周期钩子

使用生命周期钩子装饰器进行正确的资源管理：

```typescript
// ✅ 好 - 使用装饰器进行正确的生命周期管理
@TpService()
class DatabaseService {
    private client?: DatabaseClient
    private tempFiles: string[] = []
    private activeStreams: Stream[] = []
    
    @OnStart()
    async initialize() {
        this.client = await this.connect()
        console.log('DatabaseService: Connected successfully')
    }
    
    @OnTerminate()
    async cleanup() {
        // 关闭数据库连接
        if (this.client) {
            await this.client.close()
            console.log('DatabaseService: Connection closed')
        }
        
        // 关闭所有活动流
        await Promise.all(
            this.activeStreams.map(stream => 
                new Promise(resolve => stream.destroy(resolve))
            )
        )
        
        // 清理临时文件
        await Promise.all(
            this.tempFiles.map(file => fs.unlink(file).catch(console.error))
        )
        
        console.log('DatabaseService: Cleanup completed')
    }
    
    private async connect() {
        // 数据库连接逻辑
    }
}
```

### 3. 服务依赖项

清晰地组织服务依赖项：

```typescript
// ✅ 好 - 清晰的依赖结构
@TpService()
class UserService {
    constructor(
        private database: DatabaseService,
        private cache: CacheService,
        private validator: UserValidator,
        private config: TpConfigData
    ) {}
    
    async create_user(userData: any) {
        // 首先验证
        await this.validator.validate(userData)
        
        // 保存到数据库
        const user = await this.database.save(userData)
        
        // 如果启用，更新缓存
        const cacheEnabled = this.config.get('cache.enabled') ?? false
        if (cacheEnabled) {
            await this.cache.set(`user:${user.id}`, user)
        }
        
        return user
    }
}
```

## 下一步

- [**提供者**](./providers) - 了解不同的提供者类型
- [**装饰器**](./decorators) - 探索可用的装饰器
- [**内置服务**](./built-in-services) - 发现核心服务
- [**依赖注入**](./dependency-injection) - 深入了解 DI 概念 