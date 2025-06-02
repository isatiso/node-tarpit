# Node Tarpit 简介

欢迎使用 Node Tarpit！这是一个强大的 Node.js 全栈开发框架。

:::info 文档状态
中文文档正在翻译中，请先参考英文文档获取完整信息。
:::

## 主要特性

- **依赖注入**: 强大的依赖注入系统
- **模块化设计**: 可插拔的模块架构
- **类型安全**: 完整的 TypeScript 支持
- **装饰器支持**: 基于装饰器的声明式编程

## 核心模块

### 🏗️ [核心概念](./core/)
了解 Tarpit 的基础架构和核心概念。

### 🌐 [HTTP 服务器](./http-server/)
构建高性能的 Web 应用程序和 API。

### ⏰ [任务调度](./schedule/)
基于 cron 表达式的任务调度系统。

### 🐰 [RabbitMQ 客户端](./rabbitmq-client/)
消息队列客户端，支持发布订阅模式。

### 📄 [内容类型](./content-type/)
内容解析、压缩和反序列化功能。

## 快速开始

```typescript
import { Platform } from '@tarpit/core'
import { HttpServerModule } from '@tarpit/http'

const platform = new Platform({
    http: { port: 3000 }
})
.import(HttpServerModule)
.start()
```

## 获取帮助

- 📚 查看[示例项目](https://github.com/isatiso/node-tarpit/tree/main/example)
- 🐛 报告[问题](https://github.com/isatiso/node-tarpit/issues)
- 💬 参与[讨论](https://github.com/isatiso/node-tarpit/discussions) 