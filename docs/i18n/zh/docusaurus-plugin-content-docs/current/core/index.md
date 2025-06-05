---
sidebar_position: 2
---

# 核心概念

`@tarpit/core` 模块是 Tarpit 框架的基础。它提供了基本的依赖注入系统、基于装饰器的架构和平台管理，为所有 Tarpit 应用程序提供支持。

## 概述

Tarpit 的核心围绕几个关键概念构建：

- **依赖注入** - 自动解析和注入依赖项
- **装饰器** - 用于标记类和方法的 TypeScript 装饰器
- **平台** - 主应用程序容器和生命周期管理器
- **提供者** - 向 DI 系统提供依赖项的各种方式
- **内置服务** - 核心服务如日志、配置和事件处理

:::tip 示例存储库
核心概念的工作示例可以在 [`example/core/`](https://github.com/isatiso/node-tarpit/tree/main/example/core) 中找到。
:::

## 安装

```bash
npm install @tarpit/core reflect-metadata
```

:::note 为什么需要 reflect-metadata？
`reflect-metadata` 是 TypeScript 装饰器元数据反射所必需的。Tarpit 的依赖注入系统使用它来自动检测构造函数参数类型并启用类型安全的依赖项解析。
:::

:::caution 需要 TypeScript 配置
Tarpit 需要 TypeScript 装饰器。确保你的 `tsconfig.json` 包含：

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```
:::

## 快速示例

:::info 完整示例
[`example/core/quick-start.ts`](https://github.com/isatiso/node-tarpit/blob/main/example/core/quick-start.ts)
:::

这是一个显示核心概念运行的最小示例：

```typescript
import { Platform, TpService, TpModule } from '@tarpit/core'

// 一个简单的服务
@TpService()
class GreetingService {
    greet(name: string) {
        return `Hello, ${name}!`
    }
}

// 一个提供服务的模块
@TpModule({
    providers: [GreetingService]
})
class AppModule {
    constructor(private greeting: GreetingService) {}
    
    start() {
        console.log(this.greeting.greet('World'))
    }
}

// 平台引导一切
new Platform()
    .import(AppModule)
    .start()
```

## 下一步

详细探索核心概念：

- [**依赖注入**](./dependency-injection) - 了解 DI 原理及其在 Tarpit 中的工作方式
- [**平台与生命周期**](./platform-lifecycle) - 应用程序容器和生命周期管理
- [**提供者**](./providers) - 向系统提供依赖项的不同方式
- [**装饰器**](./decorators) - 可用的装饰器及其使用方法
- [**内置服务**](./built-in-services) - 框架提供的核心服务 