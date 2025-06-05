---
title: 快速开始
sidebar_position: 1
hide_title: true
---

<div style={{textAlign: 'center', marginBottom: '2rem'}}>
  <img src="/img/tarpit-full.svg" alt="Tarpit Logo" style={{width: '40%', maxWidth: '300px'}} />
</div>

<div style={{textAlign: 'center', fontSize: '1.2rem', marginBottom: '2rem'}}>
🥦 简洁而强大的 <a href="https://www.typescriptlang.org/">TypeScript</a> DI 框架，专为 Node.js 打造 🥦
</div>

{/* Metrics Badges (with numbers) */}
<div style={{textAlign: 'center', marginBottom: '1rem'}}>
  <a href="https://www.npmjs.com/package/@tarpit/core"><img src="https://img.shields.io/npm/v/@tarpit/core" alt="NPM Version" /></a>
  {' '}
  <a href="https://www.npmjs.com/package/@tarpit/core"><img src="https://img.shields.io/npm/dm/@tarpit/core" alt="Monthly Downloads" /></a>
  {' '}
  <a href="https://nodejs.org/en/"><img src="https://img.shields.io/node/v/@tarpit/core" alt="Node.js Version" /></a>
  {' '}
  <a href="https://codecov.io/gh/isatiso/node-tarpit"><img src="https://codecov.io/gh/isatiso/node-tarpit/branch/main/graph/badge.svg?token=9S3UQPNS3Y" alt="Code Coverage" /></a>
  {' '}
  <a href="https://bundlephobia.com/package/@tarpit/core"><img src="https://img.shields.io/bundlephobia/minzip/@tarpit/core" alt="Bundle Size" /></a>
  {' '}
  <a href="https://github.com/isatiso/node-tarpit/commits/main"><img src="https://img.shields.io/github/last-commit/isatiso/node-tarpit" alt="Last Commit" /></a>
</div>

{/* Status/Identity Badges (without numbers) */}
<div style={{textAlign: 'center', marginBottom: '1rem'}}>
  <a href="https://github.com/isatiso/node-tarpit/actions/workflows/ci.yml"><img src="https://img.shields.io/github/check-runs/isatiso/node-tarpit/main" alt="Build Status" /></a>
  {' '}
  <a href="https://github.com/isatiso/node-tarpit"><img src="https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  {' '}
  <a href="https://github.com/isatiso/node-tarpit/blob/main/LICENSE"><img src="https://img.shields.io/github/license/isatiso/node-tarpit" alt="MIT License" /></a>
  {' '}
  <a href="https://lerna.js.org/"><img src="https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg" alt="Lerna" /></a>
  {' '}
  <a href="https://deepwiki.com/isatiso/node-tarpit"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki" /></a>
</div>

{/* Social Badges */}
<div style={{textAlign: 'center', marginBottom: '2rem'}}>
  <a href="https://github.com/isatiso/node-tarpit"><img src="https://img.shields.io/github/stars/isatiso/node-tarpit?style=social" alt="GitHub Stars" /></a>
  {' '}
  <a href="https://github.com/isatiso/node-tarpit/network/members"><img src="https://img.shields.io/github/forks/isatiso/node-tarpit?style=social" alt="GitHub Forks" /></a>
</div>

## 什么是 Tarpit？

Tarpit 是一个现代的**依赖注入（DI）框架**，专门为 TypeScript 和 Node.js 应用程序构建。它提供了一个强大的平台，用于构建**可重用**、**可测试**和**可维护**的服务端应用程序，具有简洁的基于装饰器的架构。

### 核心特性

- **🎯 类型安全的 DI**：利用 TypeScript 的类型系统进行依赖解析
- **🚀 基于装饰器**：使用 TypeScript 装饰器的简洁、声明式语法
- **📦 模块化架构**：内置支持模块和组件组织
- **🔧 可扩展**：易于使用自定义提供者和模块进行扩展
- **⚡ 轻量级**：专注功能的最小开销
- **🧪 测试友好**：从设计之初就考虑了可测试性

### 核心概念

Tarpit 的依赖注入系统围绕三个基本概念构建：

**Platform（平台）** - 管理整个依赖注入系统的应用程序容器。它协调模块导入，控制应用程序生命周期，并作为所有服务和提供者的中央注册表。

**Providers（提供者）** - 告诉 DI 系统如何创建和提供依赖项的配方。提供者定义了如何注册和解析服务、值和工厂，无论是通过类构造函数、工厂函数还是预先存在的值。

**Injector（注入器）** - 通过将注入标记与提供者匹配来解析依赖项的核心引擎。它维护依赖项查找的分层链，充当运行时依赖项解析机制。

这三个概念协同工作：**Platform** 向 **Injector** 注册 **Providers**，然后在请求服务时解析依赖项。

## 快速开始

### 前置条件

在开始之前，请确保你拥有：

- **Node.js**（v14.0.0 或更高版本）
- **TypeScript**（v4.0 或更高版本）
- **npm** 或 **yarn** 包管理器

:::tip 尝试示例
你可以在此存储库的 [`example/`](https://github.com/isatiso/node-tarpit/tree/main/example) 目录中找到完整的工作示例，按模块组织。
:::

### 安装

创建一个新的项目目录：

```bash
mkdir my-tarpit-app
cd my-tarpit-app
```

初始化你的项目：

```bash
npm init -y
```

安装 TypeScript 和开发依赖项：

```bash
# 全局安装 TypeScript 或作为开发依赖项安装
npm install -D typescript ts-node @types/node

# 初始化 TypeScript 配置
npx tsc --init
```

在 `tsconfig.json` 中配置 TypeScript 支持装饰器：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

安装 Tarpit HTTP 模块（包含核心依赖项）：

```bash
npm install @tarpit/http @tarpit/judge @tarpit/config reflect-metadata
```

:::note 为什么需要 reflect-metadata？
`reflect-metadata` 是 TypeScript 装饰器元数据反射所必需的。Tarpit 的依赖注入系统使用它来自动检测构造函数参数类型并启用类型安全的依赖项解析。
:::

### Hello World 示例

:::info 完整示例
[`example/basic/hello-world.ts`](https://github.com/isatiso/node-tarpit/blob/main/example/basic/hello-world.ts)
:::

创建 `src/index.ts`：

```typescript
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema } from '@tarpit/core'
import { HttpServerModule, TpRouter, Get, PathArgs } from '@tarpit/http'
import { Jtl } from '@tarpit/judge'

@TpRouter('/')
class HelloRouter {
    
    @Get('hello')
    async say_hello() {
        return { message: 'Hello, Tarpit!' }
    }
    
    @Get('user/:id')
    async get_user(args: PathArgs<{ id: string }>) {
        const user_id = args.ensure('id', Jtl.string)
        return { user_id, name: `User ${user_id}` }
    }
}

const config = load_config<TpConfigSchema>({ 
    http: { port: 4100 } 
})

const platform = new Platform(config)
    .import(HttpServerModule)
    .import(HelloRouter)
    .start()
```

运行你的应用程序：

```bash
npx ts-node src/index.ts
```

测试你的端点：

```bash
# 基础 hello 端点
curl http://localhost:4100/hello

# 参数化端点
curl http://localhost:4100/user/123
```

此示例演示了：
- **基础路由**：使用 `@TpRouter` 定义路由前缀
- **HTTP 方法**：使用 `@Get` 装饰器处理 GET 端点
- **路径参数**：提取和验证 URL 参数
- **JSON 响应**：从端点返回结构化数据

### 服务注入示例

:::info 完整示例
[`example/basic/service-injection.ts`](https://github.com/isatiso/node-tarpit/blob/main/example/basic/service-injection.ts)
:::

对于更复杂的应用程序，你会希望使用依赖注入来组织代码。以下是如何使用 HTTP 路由创建可注入服务：

```typescript
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'
import { HttpServerModule, TpRouter, Get, PathArgs } from '@tarpit/http'
import { Jtl } from '@tarpit/judge'

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
    
    find_user(id: string) {
        console.log(`Finding user with ID: ${id}`)
        return { id, name: `User ${id}`, email: `user${id}@example.com` }
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
    
    get_user(id: string) {
        this.db.connect()
        return this.db.find_user(id)
    }
}

// 3. 使用注入服务的 HTTP 路由器
@TpRouter('/api/users')
class UserRouter {
    // 4. 在路由器中进行服务注入
    constructor(private userService: UserService) {}
    
    @Get('')
    async list_users() {
        return { 
            message: 'User list endpoint',
            users: ['Alice', 'Bob', 'Charlie']
        }
    }
    
    @Get(':id')
    async get_user(args: PathArgs<{ id: string }>) {
        const user_id = args.ensure('id', Jtl.string)
        const user = this.userService.get_user(user_id)
        return user
    }
    
    @Get('hello/:name')
    async greet_user(args: PathArgs<{ name: string }>) {
        const name = args.ensure('name', Jtl.string)
        this.userService.create_user(name)
        return { 
            message: `Hello, ${name}!`,
            user: { name, created: true }
        }
    }
}

async function main() {
    // 5. 注册 - 将服务和路由器注册到平台
    const config = load_config<TpConfigSchema>({ 
        http: { port: 4100 } 
    })

    const platform = new Platform(config)
        .import(HttpServerModule)
        .import(DatabaseService)
        .import(UserService)
        .import(UserRouter)
        
    await platform.start()
    
    console.log('Server started on http://localhost:4100')
    console.log('Try these endpoints:')
    console.log('  GET  http://localhost:4100/api/users')
    console.log('  GET  http://localhost:4100/api/users/123')
    console.log('  GET  http://localhost:4100/api/users/hello/Alice')
}

main().catch(console.error)
```

运行示例：

```bash
npx ts-node example/basic/service-injection.ts
```

测试 API 端点：

```bash
# 列出所有用户
curl http://localhost:4100/api/users

# 获取特定用户
curl http://localhost:4100/api/users/123

# 创建并问候用户
curl http://localhost:4100/api/users/hello/Alice
```

此示例演示了：
- **服务声明**：使用 `@TpService()` 将类标记为可注入
- **依赖注入**：通过构造函数参数自动注入依赖项
- **路由器注入**：将服务注入到 HTTP 路由器中用于 API 端点
- **服务注册**：将服务和路由器导入到平台中
- **HTTP 集成**：将依赖注入与 REST API 端点结合
- **路径参数**：使用类型安全提取和验证 URL 参数

## 下一步

准备深入了解？探索我们的综合文档：

### 核心框架
- [**核心概念**](./core/) - 了解依赖注入、提供者和平台
- [**平台生命周期**](./core/platform-lifecycle) - 理解应用程序启动和关闭
- [**依赖注入**](./core/dependency-injection) - 高级 DI 模式和最佳实践

### HTTP 服务器模块
- [**HTTP 服务器**](./http/) - Web API、路由、中间件和身份验证
- [**请求处理**](./http/request-handling) - 处理 HTTP 请求和响应
- [**中间件**](./http/middleware) - 自定义中间件和请求处理

### 其他模块
- [**RabbitMQ 模块**](./rabbitmq/) - 消息队列和事件驱动架构
- [**调度模块**](./schedule/) - Cron 作业和后台任务
- [**内容类型模块**](./content-type/) - 处理不同的数据格式

:::tip 完整示例存储库
要进行实践学习，请查看 [`example/`](https://github.com/isatiso/node-tarpit/tree/main/example) 目录，其中包含每个模块的可运行代码示例。
::: 