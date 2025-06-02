---
sidebar_position: 1
---

# 内容类型模块

:::info 翻译状态
此页面正在翻译中，完整内容请参考 [英文版本](/docs/content-type/)
:::

Tarpit 内容类型模块为 Web 应用程序提供全面的内容解析、解压缩和反序列化功能，用于处理各种 MIME 类型和编码。

## 功能特性

- **MIME 类型处理**: 解析和处理各种内容类型
- **内容解压缩**: 支持 gzip、deflate 和其他压缩格式
- **内置反序列化器**: JSON、表单数据和文本内容解析
- **字符编码**: 支持多种字符编码（UTF-8 等）
- **URL 编码**: 全面的 URL 编码/解码实用程序
- **流支持**: 处理 Buffer 和 Readable 流输入
- **可扩展架构**: 易于添加自定义反序列化器和解压器

## 核心概念

### 1. MIMEContent 结构

模块使用标准化的 `MIMEContent` 结构：

```typescript
interface MIMEContent<T> {
    type: string | undefined           // MIME 类型（如 'application/json'）
    charset: string | undefined        // 字符编码（如 'utf-8'）
    parameters: { [prop: string]: string }  // 附加的 content-type 参数
    raw: Buffer                        // 原始二进制内容
    text?: string                      // 解码的文本内容
    data?: T                          // 反序列化的结构化数据
}
```

### 2. 处理管道

内容处理遵循三阶段管道：

1. **解压缩**: 处理压缩内容（gzip、deflate）
2. **文本解码**: 使用适当的字符集将二进制转换为文本
3. **反序列化**: 根据内容类型解析结构化数据

### 3. 内容读取服务

协调整个内容处理管道的主要服务。

## 支持的内容类型

### JSON 内容

处理 JSON 内容，具有错误容错性。

### 表单数据

解析 URL 编码的表单数据。

### 文本内容

支持字符集的简单文本解码。

## URL 编码实用程序

`URLEncoding` 命名空间提供全面的 URL 编码/解码功能。 