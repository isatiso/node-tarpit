---
sidebar_position: 1
---

# 依赖注入

依赖注入（DI）是 Tarpit 框架的核心机制。它自动解析并在需要的地方注入依赖项，使你的代码更加模块化、可测试和可维护。

## 什么是依赖注入？

依赖注入是一种设计模式，其中依赖项被提供给类，而不是类自己创建它们。这种控制反转使代码更加灵活且更易于测试。

### 传统方法（不使用 DI）

```typescript
class UserService {
    private database: Database
    
    constructor() {
        // UserService 创建自己的依赖项
        this.database = new Database('localhost', 5432)
    }
}
```

### 使用依赖注入

```typescript
@TpService()
class UserService {
    // 依赖项自动注入
    constructor(private database: Database) {}
}
```

## DI 在 Tarpit 中的工作原理

Tarpit 的 DI 系统主要分为三个步骤：

1. **声明** - 将类标记为可注入服务
2. **注册** - 向 DI 容器注册服务
3. **解析** - 在需要时自动注入依赖项

### 基础示例

:::info 完整示例
[example/core/di/dependency-injection-basic.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/di/dependency-injection-basic.ts)
:::

```typescript
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'

// 1. 声明 - 将类标记为可注入服务
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
    // 2. 依赖项将自动注入
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

// 3. 注册 - 向平台注册服务
const config = load_config<TpConfigSchema>({})
const platform = new Platform(config)
    .import(DatabaseService)
    .import(UserService)

await platform.start()

// 4. 解析 - 获取完全注入的实例
const user_service = platform.expose(UserService)
if (!user_service) {
    throw new Error('UserService not found')
}

// 输出：创建用户...
user_service.create_user('Alice') // Connected to database, Executing query: INSERT INTO users (name) VALUES ('Alice'), Created user: Alice
user_service.create_user('Bob')   // Connected to database, Executing query: INSERT INTO users (name) VALUES ('Bob'), Created user: Bob

// 输出：查找用户...
user_service.find_user('Alice')   // Connected to database, Executing query: SELECT * FROM users WHERE name = 'Alice', Found user: Alice
```

## 注入点

**注入点**是可以注入依赖项的位置。Tarpit 支持在以下位置注入：

### 构造函数参数

最常见的注入点是构造函数参数。TypeScript 的类型注解用于确定要注入什么：

```typescript
@TpService()
class OrderService {
    constructor(
        private user: UserService,     // 注入 UserService
        private payment: PaymentService, // 注入 PaymentService
        private email: EmailService    // 注入 EmailService
    ) {}
}

@TpService()
class ReportService {
    constructor(
        private user_service: UserService,      // 注入 UserService
        private order_service: OrderService,    // 注入 OrderService
        private logger_service: LoggerService    // 注入 LoggerService
    ) {}
}
```

:::tip 其他注入点
虽然构造函数参数是核心模块中最常见的注入点，但其他 Tarpit 模块如 `@tarpit/http` 提供了额外的注入点，如路由处理器、中间件和守卫。这些将在各自的文档部分中介绍。
:::

## 注入标记

**注入标记**是用于注册和检索依赖项的唯一标识符。有两种方式指定注入标记：

### 1. 基于标记的注入（显式）

基于标记的注入使用 `@Inject()` 装饰器显式指定用于定位目标提供者的标记。注入标记可以是任何支持严格相等比较（`===`）的值，包括符号、字符串、类或其他原始值。

这种方法提供了最大的灵活性和对依赖项解析过程的控制，允许你将依赖项与其具体实现解耦，并支持同一类型的多个提供者。

:::info 完整示例
[example/core/di/explicit-injection.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/di/explicit-injection.ts)
:::

```typescript
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService, Inject } from '@tarpit/core'

// 定义自定义标记
const DATABASE_URL = Symbol('DATABASE_URL')
const MAX_CONNECTIONS = Symbol('MAX_CONNECTIONS')

@TpService()
class DatabaseService {
    constructor(
        @Inject(DATABASE_URL) private url: string,
        @Inject(MAX_CONNECTIONS) private max_connections: number
    ) {}
    
    connect() {
        console.log(`Connecting to database: ${this.url}`)
        console.log(`Max connections: ${this.max_connections}`)
    }
}

// 使用自定义标记注册
const config = load_config<TpConfigSchema>({})
const platform = new Platform(config)
    .import({ provide: DATABASE_URL, useValue: 'postgresql://localhost:5432/mydb' })
    .import({ provide: MAX_CONNECTIONS, useValue: 10 })
    .import(DatabaseService)

await platform.start()

const db_service = platform.expose(DatabaseService)
if (!db_service) {
    throw new Error('DatabaseService not found')
}

db_service.connect() // Connecting to database: postgresql://localhost:5432/mydb, Max connections: 10
```

### 2. 基于类型的注入（隐式）

基于类型的注入是 Tarpit 中最常用的依赖注入模式，因为它提供了更清洁、更直观的代码，无需显式装饰器。在这种方法中，DI 系统自动使用参数的 TypeScript 类型作为注入标记，无需手动指定标记。

系统遵循一个简单的规则：类类型本身既作为类型注解又作为注入标记。这是有效的，因为 TypeScript 类既是编译时类型又是运行时值，使它们成为依赖项解析的完美标识符。

:::info 完整示例
[example/core/di/implicit-injection.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/di/implicit-injection.ts)
:::

```typescript
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'

@TpService()
class EmailService {
    send(to: string, message: string) {
        console.log(`Sending email to ${to}: ${message}`)
    }
}

@TpService()
class UserService {
    // EmailService 类用作注入标记
    constructor(private email: EmailService) {}
    
    notify_user(email: string, message: string) {
        this.email.send(email, message)
    }
}

const config = load_config<TpConfigSchema>({})
const platform = new Platform(config)
    .import(EmailService)
    .import(UserService)

await platform.start()

const user_service = platform.expose(UserService)
if (!user_service) {
    throw new Error('UserService not found')
}

user_service.notify_user('user@example.com', 'Welcome to our platform!') // Sending email to user@example.com: Welcome to our platform!
```

### Reflect Metadata 的工作原理

在幕后，Tarpit 使用 `reflect-metadata` 在运行时提取构造函数参数类型。以下是 TypeScript 装饰器和元数据反射协同工作时发生的情况：

:::info 完整示例
[example/core/di/reflect-metadata-example.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/di/reflect-metadata-example.ts)
:::

```typescript
import 'reflect-metadata'
import { TpService } from '@tarpit/core'

class DatabaseService {}
interface IUserService {}

@TpService()
class ExampleService {
    constructor(
        private db: DatabaseService,        // 类类型
        private config: IUserService,       // 接口类型  
        private name: string,               // 原始类型
        private port: number,               // 原始类型
        private enabled: boolean            // 原始类型
    ) {}
}

// reflect-metadata 为构造函数参数类型返回的内容：
const param_types = Reflect.getMetadata('design:paramtypes', ExampleService)
console.log(param_types)
// 输出：[
//   [class DatabaseService],
//   [Function: Object],
//   [Function: String],
//   [Function: Number],
//   [Function: Boolean]
// ]
//
// 分解：
// - DatabaseService → [class DatabaseService]（类构造函数）
// - IUserService → [Function: Object]（接口在运行时变成 Object）  
// - string → [Function: String]（原始类型构造函数）
// - number → [Function: Number]（原始类型构造函数）
// - boolean → [Function: Boolean]（原始类型构造函数）
```

这就是为什么只有类能够无缝地作为注入标记 - 它们在运行时保持其身份，而接口变成通用的 `Object`，原始类型变成它们的构造函数，但没有相应的提供者。

### 为什么类可以作为标记

在 TypeScript 中，类既是类型又是值，使它们成为完美的注入标记：

| 声明类型 | 可作为类型 | 可作为值 | 可用作标记 |
|:---------|:----------:|:--------:|:----------:|
| 类       | ✅         | ✅       | ✅         |
| 接口     | ✅         | ❌       | ❌         |
| 类型别名 | ✅         | ❌       | ❌         |
| 枚举     | ✅         | ✅       | ✅         |

```typescript
class DatabaseService {}
interface IUserService {}

// ✅ 这有效 - 类既是类型又是值
@TpService()
class ExampleService {
    constructor(private db: DatabaseService) {} // Tarpit 获得：[class DatabaseService]
}

// ❌ 这不起作用 - 接口只是类型
@TpService()
class ExampleService {
    constructor(private config: IUserService) {} // Tarpit 获得：[Function: Object]
}

// ❌ 这不起作用 - 原始类型没有提供者
@TpService()
class ExampleService {
    constructor(
        private name: string,        // Tarpit 获得：[Function: String]，但没有注册提供者
        private port: number,        // Tarpit 获得：[Function: Number]，但没有注册提供者
        private enabled: boolean     // Tarpit 获得：[Function: Boolean]，但没有注册提供者
    ) {}
}

// ✅ 这与显式标记一起工作
enum UserRole {
    ADMIN = 'admin',
    USER = 'user'
}

@TpService()
class ExampleService {
    constructor(@Inject(UserRole.ADMIN) private role: string) {} // 与显式标记一起工作
}
```

## 依赖项解析

DI 系统遵循特定的解析过程：

### 解析顺序

1. **检查缓存** - 如果可用，返回缓存的实例
2. **检查提供者** - 查找注册的提供者
3. **创建实例** - 实例化并解析依赖项
4. **缓存结果** - 存储以供将来使用

### 依赖项解析示例

:::info 完整示例
[example/core/di/dependency-resolution.ts](https://github.com/isatiso/node-tarpit/blob/main/example/core/di/dependency-resolution.ts)
:::

以下是 DI 系统如何解析复杂依赖链的示例：

```typescript
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'

// 底层 - 无依赖项
@TpService()
class LoggerService {
    log(message: string) {
        console.log(`[LOG] ${message}`)
    }
}

// 第二层 - 依赖于 LoggerService
@TpService()
class DatabaseService {
    constructor(private logger: LoggerService) {}
    
    connect() {
        this.logger.log('Database connected')
        return true
    }
    
    query(sql: string) {
        this.logger.log(`Query executed: ${sql}`)
        return { rows: [], count: 0 }
    }
}

// 第三层 - 依赖于 DatabaseService（它依赖于 LoggerService）
@TpService()
class UserRepository {
    constructor(
        private db: DatabaseService,
        private logger: LoggerService
    ) {}
    
    find_by_id(id: number) {
        this.logger.log(`Finding user by ID: ${id}`)
        this.db.connect()
        return this.db.query(`SELECT * FROM users WHERE id = ${id}`)
    }
    
    create(name: string) {
        this.logger.log(`Creating user: ${name}`)
        this.db.connect()
        return this.db.query(`INSERT INTO users (name) VALUES ('${name}')`)
    }
}

// 第四层 - 依赖于 UserRepository（它依赖于 DatabaseService 和 LoggerService）
@TpService()
class UserService {
    constructor(
        private user_repo: UserRepository,
        private logger: LoggerService
    ) {}
    
    get_user(id: number) {
        this.logger.log(`UserService: Getting user ${id}`)
        return this.user_repo.find_by_id(id)
    }
    
    create_user(name: string) {
        this.logger.log(`UserService: Creating user ${name}`)
        return this.user_repo.create(name)
    }
}

// 顶层 - 依赖于 UserService（它有深度依赖链）
@TpService()
class UserController {
    constructor(
        private user_service: UserService,
        private logger: LoggerService
    ) {}
    
    handle_get_user(id: number) {
        this.logger.log(`UserController: Handling get user request for ID ${id}`)
        return this.user_service.get_user(id)
    }
    
    handle_create_user(name: string) {
        this.logger.log(`UserController: Handling create user request for ${name}`)
        return this.user_service.create_user(name)
    }
}

async function demonstrate_dependency_resolution() {
    console.log('Setting up platform with dependency chain...')
    
    const config = load_config<TpConfigSchema>({})
    const platform = new Platform(config)
        .import(LoggerService)      // 无依赖项
        .import(DatabaseService)    // 依赖于 LoggerService
        .import(UserRepository)     // 依赖于 DatabaseService, LoggerService
        .import(UserService)        // 依赖于 UserRepository, LoggerService
        .import(UserController)     // 依赖于 UserService, LoggerService
    
    await platform.start()
    
    console.log('\nDependency resolution chain:')
    console.log('UserController → UserService → UserRepository → DatabaseService → LoggerService')
    
    // 当我们获取 UserController 时，所有依赖项都会自动解析
    const controller = platform.expose(UserController)
    if (!controller) {
        throw new Error('UserController not found')
    }
    
    console.log('\nExecuting operations (notice the dependency chain in action):')
    controller.handle_create_user('Alice')
    // 输出显示完整的依赖链：
    // [LOG] UserController: Handling create user request for Alice
    // [LOG] UserService: Creating user Alice
    // [LOG] Creating user: Alice  
    // [LOG] Database connected
    // [LOG] Query executed: INSERT INTO users (name) VALUES ('Alice')
    
    controller.handle_get_user(1)
    // 输出显示完整的依赖链：
    // [LOG] UserController: Handling get user request for ID 1
    // [LOG] UserService: Getting user 1
    // [LOG] Finding user by ID: 1
    // [LOG] Database connected
    // [LOG] Query executed: SELECT * FROM users WHERE id = 1
}

demonstrate_dependency_resolution()
```

**关于解析的要点：**

1. **单例实例**：每个服务只创建一次（单例模式）
2. **自动解析**：依赖项递归解析
3. **顺序无关**：服务可以按任何顺序注册
4. **共享依赖项**：`LoggerService` 在所有需要它的服务之间共享

### 循环依赖

Tarpit 检测并防止循环依赖：

```typescript
@TpService()
class ServiceA {
    constructor(private serviceB: ServiceB) {}
}

@TpService()
class ServiceB {
    constructor(private serviceA: ServiceA) {} // ❌ 循环依赖
}
```

#### 循环依赖实际发生的情况

当发生循环依赖时，问题不在于依赖项解析过程本身，而在于 TypeScript 如何处理前向引用。以下是技术细节：

```typescript
// 这是循环依赖在运行时发生的情况：

@TpService()
class ServiceA {
    constructor(private serviceB: ServiceB) {}
    //                           ^^^^^^^^
    //                           这可能是 undefined！
}

@TpService()
class ServiceB {
    constructor(private serviceA: ServiceA) {}
    //                           ^^^^^^^^  
    //                           这可能是 undefined！
}

// 当 reflect-metadata 尝试获取参数类型时：
const serviceA_params = Reflect.getMetadata('design:paramtypes', ServiceA)
console.log(serviceA_params) // [undefined] ← ServiceB 由于提升而未定义

const serviceB_params = Reflect.getMetadata('design:paramtypes', ServiceB)  
console.log(serviceB_params) // [class ServiceA] ← ServiceA 已定义，因为它排在前面
```

#### 为什么会发生这种情况

问题出现是由于 JavaScript 的类提升行为：

1. **类声明被提升** - 但它们的初始化按顺序发生
2. **当 ServiceA 被定义时**，ServiceB 还没有完全初始化
3. **元数据反射**捕获 `undefined` 而不是实际的 ServiceB 类
4. **DI 系统**尝试将 `undefined` 解析为标记并失败

#### 带错误的真实示例

```typescript
@TpService()
class OrderService {
    constructor(private user: UserService) {}
    
    create_order(user_id: number, items: string[]) {
        const user = this.user.get_user(user_id) // 这将失败！
        console.log(`Creating order for ${user.name}`)
    }
}

@TpService()
class UserService {
    constructor(private order: OrderService) {}
    
    get_user(id: number) {
        return { id, name: 'Alice' }
    }
    
    get_user_orders(user_id: number) {
        return this.order.get_orders_by_user(user_id) // 这也会失败！
    }
}

// 尝试解析时的运行时错误：
// Error: Cannot resolve dependency at index 0 of class OrderService
// Reason: No provider found for token: undefined
//         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//         实际错误 - undefined 标记，不是循环检测
```

#### 如何修复循环依赖

**1. 重新设计服务边界**

```typescript
// ❌ 不好 - 循环依赖
class UserService {
    constructor(private order: OrderService) {}
}
class OrderService {
    constructor(private user: UserService) {}
}

// ✅ 好 - 引入共享服务
@TpService()
class DatabaseService {
    query_users() { /* ... */ }
    query_orders() { /* ... */ }
}

@TpService()
class UserService {
    constructor(private db: DatabaseService) {}
}

@TpService()
class OrderService {
    constructor(private db: DatabaseService) {}
}
```

**2. 使用更高级别的编排服务**

```typescript
// ✅ 更好 - 依赖于两者的编排服务
@TpService()
class UserService {
    constructor(private db: DatabaseService) {}
    get_user(id: number) { /* ... */ }
}

@TpService()
class OrderService {
    constructor(private db: DatabaseService) {}
    create_order(user_id: number, items: string[]) { /* ... */ }
}

@TpService()
class UserOrderService {
    constructor(
        private user: UserService,
        private order: OrderService
    ) {}
    
    create_order_for_user(user_id: number, items: string[]) {
        const user = this.user.get_user(user_id)
        return this.order.create_order(user_id, items)
    }
}
```

**3. 使用事件/消息模式**

```typescript
@TpService()
class EventBus {
    private handlers = new Map()
    
    emit(event: string, data: any) {
        const handler = this.handlers.get(event)
        if (handler) handler(data)
    }
    
    on(event: string, handler: Function) {
        this.handlers.set(event, handler)
    }
}

@TpService()
class UserService {
    constructor(private events: EventBus) {}
    
    create_user(name: string) {
        const user = { id: Date.now(), name }
        this.events.emit('user.created', user)
        return user
    }
}

@TpService()
class OrderService {
    constructor(private events: EventBus) {
        // 监听用户事件而不是直接依赖 UserService
        this.events.on('user.created', (user: any) => {
            console.log(`Ready to process orders for user: ${user.name}`)
        })
    }
}
```

:::warning 循环依赖
记住：错误发生是因为由于 JavaScript 的类初始化顺序，其中一个依赖标记变成了 `undefined`，而不是因为 DI 系统检测到循环。始终重新设计你的服务以避免循环引用。
:::

## 最佳实践

### 1. 使用构造函数注入

优先使用构造函数注入而不是其他模式：

```typescript
// ✅ 好 - 构造函数注入
@TpService()
class UserService {
    constructor(private db: DatabaseService) {}
}

// ❌ 避免 - 手动实例化
@TpService()
class UserService {
    private db = new DatabaseService()
}
```

### 2. 依赖于抽象

在可能的情况下，依赖于接口而不是具体类：

```typescript
abstract class PaymentProvider {
    abstract process(amount: number): Promise<void>
}

@TpService()
class StripePaymentProvider extends PaymentProvider {
    async process(amount: number) {
        // Stripe 实现
    }
}

@TpService()
class OrderService {
    // 依赖于抽象，而不是实现
    constructor(private payment: PaymentProvider) {}
}
```

### 3. 最小化依赖项

将构造函数参数保持在合理的数量：

```typescript
// ✅ 好 - 少量、专注的依赖项
@TpService()
class UserService {
    constructor(
        private db: DatabaseService,
        private validator: ValidationService
    ) {}
}

// ❌ 太多依赖项 - 考虑重构
@TpService()
class GodService {
    constructor(
        private db: DatabaseService,
        private cache: CacheService,
        private email: EmailService,
        private sms: SmsService,
        private logger: LoggerService,
        private config: ConfigService,
        private metrics: MetricsService
        // ... 太多了！
    ) {}
}
```

## 下一步

- [**平台与生命周期**](./platform-lifecycle) - 了解应用程序容器
- [**提供者**](./providers) - 探索提供依赖项的不同方式
- [**装饰器**](./decorators) - 可用的装饰器及其用法