---
sidebar_position: 1
---

# RabbitMQ 客户端

:::info 翻译状态
此页面正在翻译中，完整内容请参考 [英文版本](/docs/rabbitmq-client/)
:::

Tarpit RabbitMQ 模块提供了强大的消息队列客户端，支持依赖注入，基于流行的 `amqplib` 库构建。它提供了发布者和消费者的装饰器、自动连接管理和消息确认策略。

## 功能特性

- **装饰器 API**: 使用 `@Publish`、`@Enqueue` 和 `@Consume` 装饰器
- **自动连接管理**: 内置连接池和重连机制
- **消息确认**: 支持 ack、nack、requeue 和 kill 操作
- **交换器与队列定义**: 声明式拓扑管理
- **错误处理**: 结构化错误处理和重试策略
- **类型安全**: 完整的 TypeScript 支持和类型安全的消息处理

## 核心组件

1. **RabbitClient**: 主要的连接管理
2. **RabbitDefine**: 交换器和队列拓扑定义
3. **生产者**: 消息发布（`@Publish`、`@Enqueue`）
4. **消费者**: 消息消费（`@Consume`）
5. **消息处理**: 确认和错误策略

## 装饰器概览

| 装饰器 | 用途 | 使用方式 |
|--------|------|----------|
| `@Publish` | 发布到交换器，使用路由键 | `@Publish('my.exchange', 'routing.key')` |
| `@Enqueue` | 直接发送到队列 | `@Enqueue('my.queue')` |
| `@Consume` | 从队列消费消息 | `@Consume('my.queue', options)` |
| `@TpProducer` | 生产者类装饰器 | `@TpProducer({ providers: [...] })` |
| `@TpConsumer` | 消费者类装饰器 | `@TpConsumer({ providers: [...] })` |

## 消息确认

模块提供多种处理消息确认的方式：

- **自动确认**: 成功返回结果
- **手动确认**: `ack_message()`
- **重新排队**: `requeue_message()`
- **杀死消息**: `kill_message()`

## 交换器和队列管理

使用 `RabbitDefine` 定义消息拓扑结构。 