---
sidebar_position: 4
---

# 装饰器

Tarpit 使用 TypeScript 装饰器创建强大的分层组件系统。理解装饰器架构是掌握 Tarpit 依赖注入和组件组织的关键。

## 装饰器架构概述

Tarpit 的装饰器系统遵循清晰的继承层次结构：

<div className="mb-8">

```
TpComponent (所有 Tp 装饰器的基类)
│
├── TpWorker (功能单元 - 可被注入)
│   │
│   └── @TpService (可注入服务)
│
├── TpAssembly (模块组装单元 - 具有导入/提供者)
│   │
│   ├── @TpModule (依赖组织模块)
│   │
│   └── TpEntry (入口点服务 - 依赖树端点)
│       │
│       └── @TpRoot (注入层次边界 - 创建子注入器)
│
└── TpUnit (特殊方法标记)
    │
    ├── @OnStart (生命周期初始化)
    │
    └── @OnTerminate (清理操作)
```

</div>

### 核心组件类型

<div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">

<div>

**🔧 TpWorker** - *功能单元*

- 可以作为依赖项注入
- 应用程序逻辑的构建块
- 默认为单例

*示例：`@TpService()`*

</div>

<div>

**📦 TpAssembly** - *模块组织*

- 具有导入/提供者的模块组装
- 控制服务暴露
- 分组相关功能

*示例：`@TpModule()`*

</div>

</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">

<div>

**⚡ TpEntry** - *入口点服务*

- 加载时始终实例化
- 依赖树端点
- 特定功能的功能入口点

*示例：`@TpRouter()`、`@TpConsumer()`*

</div>

<div>

**🚪 TpRoot** - *注入边界*

- 创建子注入器
- 模块隔离边界
- 分层依赖管理

*示例：`@TpRoot()`*

</div>

</div>

<div className="grid grid-cols-1 md:grid-cols-1 gap-8 my-8">

<div>

**⚙️ TpUnit** - *方法标记*

- 特殊方法行为
- 生命周期管理
- 功能扩展

*示例：`@OnStart`、`@OnTerminate`*

</div>

</div>

### 关键优势

- **清晰的关注点分离** - 每种装饰器类型都有特定的作用
- **可预测的行为** - 子装饰器继承父级能力
- **灵活的组合** - 装饰器可以有效组合
- **可扩展的架构** - 随着应用程序增长易于扩展和维护

## 抽象装饰器

以下是构成 Tarpit 装饰器系统基础的抽象基类。这些不直接使用，但为具体装饰器提供继承层次结构。

### TpComponent

`TpComponent` 是所有 Tarpit 类装饰器的基础。它提供：

- 通过标记进行**唯一标识**
- **实例管理**功能
- 与 **DI 系统的集成**

所有 Tarpit 类装饰器都继承自 `TpComponent`，确保整个框架的行为一致性。

### TpWorker - 功能单元

`TpWorker` 扩展了 `TpComponent`，用于表示可以作为依赖项注入的**功能单元**。Worker 是应用程序逻辑的构建块。

### TpAssembly - 模块组织

`TpAssembly` 扩展了 `TpComponent` 以支持**模块组装**，具有：

- **imports** - 导入其他模块的能力
- **providers** - 模块提供的服务声明

### TpEntry - 入口点服务

`TpEntry` 扩展了 `TpAssembly`，用于标记在依赖树中作为功能端点的**入口点服务**。这些组件在加载时始终实例化：

- **始终实例化** - 无论依赖使用情况如何都会创建实例
- **依赖树端点** - 位于依赖树的叶节点
- **功能入口点** - 作为特定应用程序功能（如路由、消息消费等）的入口点

### TpRoot - 注入边界

:::note 为什么 TpRoot 出现在这里
虽然 `TpRoot` 是一个具体的装饰器（不是抽象的），但它出现在此部分是因为它在装饰器层次结构中起着基础架构作用。作为唯一创建子注入器的装饰器，在学习其实际使用模式之前，理解 `TpRoot` 的架构行为是至关重要的。
:::

`TpRoot` 扩展了 `TpEntry` 以创建**注入层次边界**。当平台遇到 `TpRoot` 时，它会创建一个子注入器，使得：

- **模块隔离** - 不同模块可以有单独的依赖实现
- **作用域服务** - 限制在特定应用程序部分的服务
- **分层结构** - 跨应用程序层的有组织的依赖管理

### TpUnit - 方法标记

`TpUnit` 用于标记具有特定行为的**特殊方法**，特别是用于生命周期管理和功能扩展。

## 工作组件

### @TpService（扩展 TpWorker）

`@TpService()` 装饰器将类标记为可注入服务：

```typescript
import { TpService } from '@tarpit/core'

@TpService()
class UserService {
    private users: User[] = []
    
    create_user(name: string): User {
        const user = { id: Date.now(), name }
        this.users.push(user)
        return user
    }
    
    find_user(id: number): User | undefined {
        return this.users.find(u => u.id === id)
    }
}
```

**关键特征：**
- **可注入** - 可以通过构造函数注入到其他服务中
- **默认单例** - 每个注入器作用域一个实例
- **依赖解析** - 依赖项自动注入

#### 服务选项

```typescript
@TpService({
    inject_root: true,        // 从根注入器而不是当前注入器注入
    echo_dependencies: true   // 在初始化期间记录依赖信息
})
class UserRepository {
    // 此服务将从根注入器注入
    // 并在创建时输出依赖信息
}
```

### @TpModule（扩展 TpAssembly）

`@TpModule()` 装饰器分组相关服务并管理依赖项：

```typescript
import { TpModule, TpService } from '@tarpit/core'

@TpService()
class UserService { /* ... */ }

@TpService()
class UserRepository { /* ... */ }

@TpModule({
    providers: [UserService, UserRepository],  // 此模块提供的服务
    imports: [DatabaseModule],                 // 要导入的其他模块
    inject_root: true                          // 可选：从根注入器注入
})
class UserModule {}
```

**模块功能：**
- **提供者注册** - 声明模块提供哪些服务
- **模块组合** - 从其他模块导入功能
- **根注入** - 可选择从根注入器而不是当前作用域注入
- **依赖组织** - 分组相关功能

:::note 模块导出
与某些 DI 系统不同，Tarpit 模块不使用显式的 `exports`。模块中声明的所有提供者都自动可用于导入它的模块。这简化了模块组织并减少了配置开销。
:::

### @TpRoot（扩展 TpEntry）

`@TpRoot()` 装饰器定义应用程序入口点并创建隔离的依赖作用域：

```typescript
import { TpRoot } from '@tarpit/core'

@TpRoot({
    imports: [UserModule, DatabaseModule],    // 要导入的模块
    entries: [UserRouter, TaskScheduler],     // 要实例化的入口点服务
    providers: [GlobalService]               // 此作用域的额外服务
})
class AppRoot {}

// 使用导入启动应用程序
const platform = new Platform(config)
    .import(AppRoot)

await platform.start()
```

**实际用途：**
- **应用程序引导** - 为你的应用程序定义主入口点
- **模块隔离** - 为应用程序的不同部分创建单独的上下文（Web 服务器、后台作业、测试）
- **入口点管理** - 自动实例化和管理入口点服务，如路由器和消费者
- **配置作用域** - 为不同环境提供不同的服务实现

:::note TpRoot 和 inject_root
`@TpRoot` 不支持 `inject_root` 选项，因为它与 TpRoot 创建注入边界的核心目的冲突。TpRoot 实例始终在它们自己的子注入器上下文中创建。
:::

## 参数装饰器

### @Inject

使用 `@Inject()` 指定自定义注入标记：

```typescript
import { Inject, TpService } from '@tarpit/core'

// 定义标记
const DATABASE_URL = Symbol('DATABASE_URL')
const MAX_RETRIES = Symbol('MAX_RETRIES')

@TpService()
class DatabaseService {
    constructor(
        @Inject(DATABASE_URL) private url: string,
        @Inject(MAX_RETRIES) private max_retries: number
    ) {}
    
    connect() {
        console.log(`Connecting to: ${this.url} (max retries: ${this.max_retries})`)
    }
}

// 注册值
platform
    .import({ provide: DATABASE_URL, useValue: 'postgresql://localhost:5432' })
    .import({ provide: MAX_RETRIES, useValue: 3 })
    .import(DatabaseService)
```

### @Optional

将依赖项标记为可选：

```typescript
import { Optional, TpService } from '@tarpit/core'

@TpService()
class EmailService {
    constructor(
        private logger: LoggerService,
        @Optional() private metrics?: MetricsService  // 可选依赖项
    ) {}
    
    send_email(to: string, subject: string) {
        this.logger.log(`Sending email to ${to}`)
        
        // 安全使用 - 可能是 undefined
        this.metrics?.increment('emails_sent')
    }
}
```

### @Disabled

标记类、方法或参数被特定模块跳过：

```typescript
import { Disabled, TpService } from '@tarpit/core'

@TpService()
class FileService {
    constructor(
        private logger: LoggerService,
        @Disabled() private base_dir: string = '/tmp'  // 标记为被 DI 系统跳过
    ) {}
    
    @Disabled()
    deprecated_method() {
        // 此方法可能被某些处理模块跳过
    }
}

@Disabled()
@TpService()
class LegacyService {
    // 整个服务可能被某些模块跳过
}
```

**关键特征：**
- **标记装饰器** - 只是添加元数据，不直接改变行为
- **特定于模块的行为** - 如何处理取决于消费模块
- **一般含义** - 表示在处理过程中应该跳过装饰的元素

## 方法装饰器（基于 TpUnit）

### @OnStart

标记在创建服务时要调用的方法：

```typescript
import { TpService, OnStart } from '@tarpit/core'

@TpService()
class DatabaseService {
    private connection: any
    
    @OnStart()
    async initialize() {
        console.log('DatabaseService: Connecting to database...')
        this.connection = await this.create_connection()
        console.log('DatabaseService: Connected successfully')
    }
    
    private async create_connection() {
        // 数据库连接逻辑
    }
}
```

### @OnTerminate

标记在应用程序关闭期间要调用的方法：

```typescript
import { TpService, OnTerminate } from '@tarpit/core'

@TpService()
class DatabaseService {
    private connection: any
    
    @OnTerminate()
    async cleanup() {
        console.log('DatabaseService: Closing connection...')
        if (this.connection) {
            await this.connection.close()
        }
        console.log('DatabaseService: Connection closed')
    }
}
```

## 高级模式

### 分层模块组织

利用装饰器层次结构实现清洁架构：

```typescript
// 低层服务（TpWorker）
@TpService()
class DatabaseService { /* ... */ }

@TpService() 
class UserRepository { /* ... */ }

// 中层模块组织（TpAssembly）
@TpModule({
    providers: [DatabaseService, UserRepository]
})
class DatabaseModule {}

@TpModule({
    imports: [DatabaseModule],
    providers: [UserService]
})
class UserModule {}

// 具有入口点服务的注入边界（TpRoot 扩展 TpEntry）
@TpRoot({
    imports: [UserModule],
    entries: [UserController]  // UserController 是入口点服务 - 始终实例化
})
class AppRoot {}
```

### 具有多个装饰器的复杂服务

```typescript
@TpService({ inject_root: true })
class AdvancedService {
    constructor(
        private logger: LoggerService,
        @Optional() @Inject('feature-flag') private feature_enabled?: boolean,
        @Disabled() private debug_mode: boolean = false
    ) {}
    
    @OnStart()
    async initialize() {
        this.logger.log('AdvancedService initializing...')
        if (this.feature_enabled) {
            await this.enable_advanced_features()
        }
    }
    
    @OnTerminate()
    async cleanup() {
        this.logger.log('AdvancedService shutting down...')
        await this.perform_cleanup()
    }
    
    private async enable_advanced_features() {
        // 功能初始化
    }
    
    private async perform_cleanup() {
        // 清理逻辑
    }
}
```

### 注入边界管理

使用 `TpRoot` 装饰器创建隔离的注入器作用域：

```typescript
// 全局作用域
@TpService()
class GlobalConfigService { /* ... */ }

// HTTP 请求作用域 - 单独的注入器
@TpRoot({
    imports: [UserModule],
    providers: [RequestContextService],  // 作用域限于此注入器
    entries: [HttpController]           // HTTP 处理的入口点服务
})
class HttpRequestHandler {}

// 后台作业作用域 - 单独的注入器
@TpRoot({
    imports: [UserModule], 
    providers: [JobContextService],     // 与 HTTP 作用域不同的实例
    entries: [JobProcessor]             // 作业处理的入口点服务
})
class BackgroundJobHandler {}
``` 