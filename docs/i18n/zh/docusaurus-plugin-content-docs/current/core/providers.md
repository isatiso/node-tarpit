---
sidebar_position: 3
---

# 提供者

提供者告诉依赖注入系统如何创建和提供依赖项。它们是使依赖注入工作的基础，定义了服务、值和工厂如何注册和解析。

## 什么是提供者？

**提供者**是一个配方，告诉 DI 系统如何创建依赖项的实例。当服务请求依赖项时，DI 系统使用适当的提供者来创建或检索该依赖项。

### 提供者概念

```typescript
// 当这个服务被创建时...
@TpService()
class UserService {
    constructor(private db: DatabaseService) {} // DI 如何获取 DatabaseService？
}

// 答案是：通过提供者
platform.import(DatabaseService) // 这为 DatabaseService 创建了一个 ClassProvider
```

## 提供者类型

Tarpit 支持几种不同用例的提供者类型：

### 1. ClassProvider

最常见的提供者类型 - 告诉 DI 使用类构造函数创建实例。

ClassProvider 有两种定义形式：

**简写形式（推荐）**
```typescript
@TpService()
class DatabaseService {
    connect() {
        console.log('Connected to database')
    }
}

// 简写：直接传递类
// 等价于 { provide: DatabaseService, useClass: DatabaseService }
platform.import(DatabaseService)
```

**显式对象形式**
```typescript
// 显式形式：当标记和实现相同时
platform.import({
    provide: DatabaseService,
    useClass: DatabaseService
})

// 显式形式：当标记和实现不同时
platform.import({
    provide: 'database-service',    // 注入时使用的标记
    useClass: DatabaseService      // 实现类
})

// 显式形式：基于接口的注入
interface PaymentProcessor {
    process(amount: number): Promise<void>
}

@TpService()
class StripePaymentProcessor implements PaymentProcessor {
    async process(amount: number) {
        // Stripe 实现
    }
}

platform.import({
    provide: 'PaymentProcessor',        // 字符串标记
    useClass: StripePaymentProcessor    // 具体实现
})
```

**使用示例**
```typescript
@TpService()
class UserService {
    constructor(
        private db: DatabaseService,                           // 通过简写形式注入
        @Inject('database-service') private db2: DatabaseService, // 通过字符串标记注入
        @Inject('PaymentProcessor') private payment: PaymentProcessor // 通过接口注入
    ) {}
}
```

:::info 完整示例
[example/core/providers/01-class-provider.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/providers/01-class-provider.ts)
:::

### 2. ValueProvider

提供预先存在的值或对象：

```typescript
// 简单值
platform.import({
    provide: 'app-name',
    useValue: 'My Awesome App'
})

// 配置对象
platform.import({
    provide: 'database-config',
    useValue: {
        host: 'localhost',
        port: 5432,
        database: 'myapp'
    }
})

// 在注入中使用
@TpService()
class DatabaseService {
    constructor(
        @Inject('database-config') private config: any
    ) {}
}
```

:::info 完整示例
[example/core/providers/02-value-provider.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/providers/02-value-provider.ts)
:::

### 3. FactoryProvider

使用函数创建依赖项：

```typescript
// 简单工厂
platform.import({
    provide: 'timestamp',
    useFactory: () => Date.now()
})

// 带依赖项的工厂
platform.import({
    provide: 'database-connection',
    useFactory: (config: any) => {
        return new Database(config.host, config.port)
    },
    deps: ['database-config'] // 工厂的依赖项
})

// 复杂工厂
platform.import({
    provide: 'logger',
    useFactory: (config: AppConfig) => {
        if (config.debug) {
            return new ConsoleLogger()
        } else {
            return new FileLogger('/var/log/app.log')
        }
    },
    deps: [TpConfigData]
})
```

:::info 完整示例
[example/core/providers/03-factory-provider.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/providers/03-factory-provider.ts)
:::

## 提供者注册

### 使用 .import()

`.import()` 方法接受各种提供者格式：

```typescript
// 类（创建 ClassProvider）
platform.import(UserService)

// 逐个导入多个服务
platform.import(UserService)
platform.import(OrderService)
platform.import(PaymentService)

// 显式提供者对象
platform.import({
    provide: UserService,
    useClass: UserService
})

// 逐个导入多个提供者
platform.import(UserService)
platform.import({ provide: 'api-key', useValue: 'secret-key' })
platform.import({ provide: 'database', useFactory: () => new Database() })
```

### 模块提供者

模块可以声明自己的提供者：

```typescript
@TpModule({
    providers: [
        UserService,
        { provide: 'api-url', useValue: 'https://api.example.com' },
        {
            provide: 'http-client',
            useFactory: (url: string) => new HttpClient(url),
            deps: ['api-url']
        }
    ]
})
class ApiModule {}
```

## 高级提供者模式

### 条件提供者

使用工厂根据条件提供不同的实现：

```typescript
// 定义接口
abstract class PaymentProcessor {
    abstract process(amount: number): Promise<void>
}

// 实现
@TpService()
class StripeProcessor extends PaymentProcessor {
    async process(amount: number) {
        // Stripe 实现
    }
}

@TpService()
class PayPalProcessor extends PaymentProcessor {
    async process(amount: number) {
        // PayPal 实现
    }
}

// 条件提供者
platform.import({
    provide: PaymentProcessor,
    useFactory: (config: TpConfigData) => {
        const paymentProvider = config.get('payment.provider')
        if (paymentProvider === 'stripe') {
            return new StripeProcessor()
        } else {
            return new PayPalProcessor()
        }
    },
    deps: [TpConfigData]
})
```

### 多提供者

为同一标记提供多个值：

```typescript
// 定义标记
const PLUGIN_TOKEN = Symbol('PLUGINS')

// 注册多个提供者
platform.import({ provide: PLUGIN_TOKEN, useValue: new AuthPlugin(), multi: true })
platform.import({ provide: PLUGIN_TOKEN, useValue: new LoggingPlugin(), multi: true })
platform.import({ provide: PLUGIN_TOKEN, useValue: new CachePlugin(), multi: true })

// 将所有提供者作为数组注入
@TpService()
class PluginManager {
    constructor(@Inject(PLUGIN_TOKEN) private plugins: Plugin[]) {
        // plugins 是所有注册插件的数组
    }
}
```

:::info 完整示例
[example/core/providers/04-multi-provider.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/providers/04-multi-provider.ts)
:::

## 最佳实践

### 1. 使用描述性标记

为你的提供者使用清晰、描述性的标记：

```typescript
// ✅ 好 - 清晰且描述性强
const DATABASE_CONNECTION_STRING = Symbol('DATABASE_CONNECTION_STRING')
const HTTP_CLIENT_TIMEOUT = Symbol('HTTP_CLIENT_TIMEOUT')

// ❌ 避免 - 模糊或令人困惑
const CONFIG = Symbol('CONFIG')
const THING = Symbol('THING')
```

### 2. 优先使用类提供者

尽可能使用类提供者以获得更好的类型安全：

```typescript
// ✅ 好 - 类型安全的类提供者
@TpService()
class EmailService {
    send(to: string, message: string) { /* ... */ }
}

// ❌ 不太理想 - 无类型的值提供者
platform.import({
    provide: 'email-service',
    useValue: {
        send: (to: string, message: string) => { /* ... */ }
    }
})
```

### 3. 保持工厂简单

保持工厂函数专注且可测试：

```typescript
// ✅ 好 - 简单、专注的工厂
platform.import({
    provide: 'logger',
    useFactory: (config: TpConfigData) => {
        const debug = config.get('debug') ?? false
        return debug ? new ConsoleLogger() : new FileLogger()
    },
    deps: [TpConfigData]
})

// ❌ 避免 - 有副作用的复杂工厂
platform.import({
    provide: 'complex-service',
    useFactory: (config: TpConfigData) => {
        // 工厂中逻辑过多
        const service = new ComplexService()
        service.configure(config.get())
        service.loadPlugins()
        service.initializeDatabase()
        return service
    },
    deps: [TpConfigData]
})
```

### 4. 使用接口进行抽象

定义接口以获得更好的抽象：

```typescript
// 定义接口
interface Logger {
    log(message: string): void
}

// 实现接口
@TpService()
class ConsoleLogger implements Logger {
    log(message: string) {
        console.log(message)
    }
}

// 使用接口作为标记
platform.import({
    provide: Logger,
    useClass: ConsoleLogger
})
```

## 下一步

- [**装饰器**](./decorators) - 了解可用的装饰器
- [**内置服务**](./built-in-services) - 发现核心服务
- [**依赖注入**](./dependency-injection) - 回顾 DI 基础知识 