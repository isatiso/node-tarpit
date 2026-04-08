---
sidebar_position: 2
title: HTTP Gap Analysis
---

# HTTP 模块 Gap Analysis

与主流 HTTP 框架对比：NestJS、Fastify、Express/Koa、Hono。

## 已实现的核心功能

- 基于装饰器的路由（`@Get`、`@Post`、`@Put`、`@Delete`、`@Route`、`@WS`）
- 路由分组 `@TpRouter('/prefix')`，DI 驱动的参数注入
- 路径参数（`path-to-regexp`）+ 查询参数（`Params`、`PathArgs`）
- 请求体解析（`JsonBody`、`FormBody`、`TextBody`、`RawBody`、`MimeBody`），支持 content-type 协商
- WebSocket 原生支持（`@WS` 装饰器 + `TpWebSocket` 封装）
- 认证框架（`@Auth` + 可替换的 `HttpAuthenticator`）
- 全局 CORS 配置（allow_origin、allow_methods、allow_headers、max_age）
- 静态文件服务（ETag、Last-Modified、Cache-Control、dotfile 处理、文件监听 + LRU 缓存）
- 文件管理服务（读写/流式/tar.gz 归档/文件锁）
- 生命周期钩子（`HttpHooks`：on_init、on_finish、on_error、on_ws_init、on_ws_close——可通过 DI 替换）
- 响应缓存（基于 LRU 的 `HttpCacheProxy` + `ResponseCache` + `@CacheUnder` 装饰器）
- 请求体大小限制（`http.body.max_length` 配置）
- 内容协商（`@tarpit/negotiator`）
- 代理支持（X-Forwarded-For、X-Forwarded-Host、可配置 ip_header）
- 优雅停机（terminate timeout + socket 清理）
- HEAD 请求自动支持（映射到 GET handler）
- 重定向支持（`TpResponse.redirect()`）
- 流式响应（Stream pipe 到 response）
- `@ContentType` 装饰器指定响应内容类型
- `@Disabled` 装饰器禁用路由
- 可配置的 keepalive timeout
- `HttpInspector` 提供路由列表和编程式路由绑定
- `HttpBodyFormatter` 支持错误响应的内容协商（JSON vs text）
- `Finish` / `TpHttpFinish` 错误模型，提供类型化 throw 辅助函数（`throw_bad_request`、`throw_not_found` 等）
- PATCH HTTP 方法（`@Patch` 装饰器）
- 响应压缩（gzip/br，基于 zlib 流式实现，可配置 threshold/encodings）
- CORS 增强：credentials、expose_headers、精确多 origin 匹配

## 与主流框架的差距评估

### 1. 缺少 PATCH HTTP 方法

**状态**：已完成

在 `ApiMethod` 中添加了 `'PATCH'`，创建了 `@Patch` 装饰器，更新了 OPTIONS/Allow 头的生成逻辑。

**决定**：已实现

---

### 2. 路由级 Middleware / 拦截器

**状态**：缺失

当前 `HttpHooks` 提供全局生命周期钩子（on_init/on_finish/on_error），统一应用于所有路由。唯一的定制方式是通过 DI 替换整个 `HttpHooks` 服务。没有机制支持：
- 对特定路由或路由组应用 middleware
- 串联多个 middleware（管道/洋葱模型）
- NestJS 风格的分层关注点：Guards → Interceptors → Pipes → Exception Filters

主流框架对比：
- **Express/Koa**：`app.use()` / `router.use()` 中间件链
- **NestJS**：Guards、Interceptors、Pipes、Exception Filters——可作用于 controller/route 级别
- **Fastify**：onRequest/preParsing/preValidation/preHandler/onSend/onResponse 钩子，可限定作用域到路由或插件
- **Hono**：`app.use('/path', middleware)` 可组合中间件

**决定**：待定——当前通过全局可替换服务（`HttpHooks`、`HttpAuthenticator`）+ 路由级装饰器（`@Auth`、`@CacheUnder`）+ `TpRouter` 级 providers 注入，已覆盖大部分 middleware 场景。需要观察是否有当前机制无法满足的实际需求再决定。

---

### 3. 响应压缩（gzip/brotli）

**状态**：已完成

在 `flush_response.ts` 中基于 Node.js 内置 `zlib` 实现，根据 `Accept-Encoding` 头选择编码（优先 br，fallback gzip）。所有 body 类型统一走 Stream 分支，压缩后移除 `Content-Length`。跳过条件：已设置 `Content-Encoding`、`204`/`304` 空响应、body 低于 threshold。配置项：`http.compression`（enable、threshold、encodings）。

**决定**：已实现

---

### 4. CORS 配置增强

**状态**：部分实现

当前 CORS 实现：
- 单一静态 `allow_origin` 字符串（不支持动态 origin、不支持函数回调）
- 不支持 `credentials`（`Access-Control-Allow-Credentials`）
- 不支持 `expose-headers`（`Access-Control-Expose-Headers`）
- 仅全局配置——不支持按路由的 CORS 配置

主流框架支持：
- 动态 origin（接收请求 origin，返回布尔值的函数）
- 多个允许的 origin
- `credentials: true` 用于 cookie 认证
- `exposedHeaders` 指定客户端可读取的自定义响应头
- 按路由覆盖 CORS 配置

**决定**：已实现。`credentials`、`expose_headers`、精确多 origin 匹配均已支持。`allow_origin` 扩展为字符串数组，根据请求 `Origin` 头精确匹配后回写。

---

### 5. Cookie 解析与管理

**状态**：缺失

没有内置的 cookie 解析或设置支持。`TpRequest` 不暴露 cookies；`TpResponse` 没有 cookie 辅助方法。

主流框架：
- **Express**：`cookie-parser` 中间件 + `res.cookie()` / `res.clearCookie()`
- **Fastify**：`@fastify/cookie`
- **Koa**：`ctx.cookies.get()` / `ctx.cookies.set()`
- **Hono**：`c.cookie()` / `c.getCookie()`

**决定**：不做。tarpit 定位 API 框架，cookie 不是核心需求。用户有需要时可通过 `request.get('Cookie')` 读取、`response.set('Set-Cookie', ...)` 设置，几行代码即可解决。

---

### 6. 限流

**状态**：缺失

没有限流支持。对于生产环境 API 安全至关重要（防止滥用、DDoS 缓解）。

主流框架：
- **Express**：`express-rate-limit`
- **Fastify**：`@fastify/rate-limit`
- **NestJS**：`@nestjs/throttler`

可能的实现方式：
- 可配置的服务或中间件
- 基于窗口的限流（固定窗口、滑动窗口）
- 按 IP 或按用户限流
- 可配置的响应（429 Too Many Requests）

**决定**：不做。限流应在基础设施层（云网关、反向代理、Redis）处理，应用层限流在多实例部署时失效，且恶意流量应在到达应用之前被拦截。

---

### 7. Request ID / Correlation ID

**状态**：缺失

没有自动的请求 ID 生成用于追踪。对日志、调试和分布式系统可观测性很有用。

主流框架通常：
- 每个请求生成一个 UUID（或接受 `X-Request-ID` 请求头）
- 附加到 `HttpContext` 和响应头
- 在日志输出中可用

**决定**：不做。用户可在 `HttpHooks.on_init` 中几行代码自行实现，灵活度更高（自定义 ID 生成策略、header 名称、是否接受外部传入等）。

---

### 8. HTTPS/TLS 原生支持

**状态**：缺失

`HttpServer.start()` 只创建 `http.createServer()`。不支持带 TLS 证书的 `https.createServer()`。

主流框架：
- **NestJS**：`NestFactory.create(AppModule, { httpsOptions: { key, cert } })`
- **Fastify**：`fastify({ https: { key, cert } })`
- **Express**：`https.createServer(options, app)`

**缓解方案**：生产环境通常通过反向代理（nginx、caddy）处理。但原生支持对开发和简单部署比较方便。

**决定**：不做。TLS 终止应由基础设施层（反向代理 nginx/caddy、云负载均衡）处理，Node.js 应用不应直接暴露在外网。

---

### 9. HTML 错误页面模板

**状态**：部分实现（代码中有 TODO）

`HttpBodyFormatter.format()` 中有 `// TODO: support html` 注释。当客户端偏好 `text/html` 时，错误响应回退到纯文本而非渲染 HTML 错误页面。

**决定**：不做。tarpit 是 API 框架，客户端接收 JSON 错误响应。用户如需自定义错误格式（包括 HTML），可替换 `HttpBodyFormatter`。代码中的 `// TODO: support html` 注释应删除。

---

### 10. Multipart 文件上传

**状态**：待确认

`MimeBody` 存在，但不确定是否处理了 `multipart/form-data` 文件上传（文件流、临时文件存储、按字段的大小限制）。这取决于 `@tarpit/content-type` 的能力。主流框架使用 busboy/multer/formidable 处理这部分。

**决定**：实现。当前 `ContentTypeModule` 没有注册 `multipart/form-data` 的 deserializer，且请求体处理流程是整体读入 `Buffer`（`readable_to_buffer`），大文件会撑爆内存。需要整体审视大文件上传的方案。

**实现方案**：待设计——需要考虑：
- 流式解析 multipart/form-data（busboy 或类似方案），避免大文件全量加载到内存
- 支持按字段区分文件和普通表单数据
- 文件大小限制（按字段级别）
- 临时文件存储策略
- 与现有 `MimeBody` / `content-type` 模块的集成方式（在 content-type 层扩展 deserializer，还是在 http 层独立处理）

---

### 11. OpenAPI / Swagger 文档生成

**状态**：缺失

只有 `HttpInspector.list_router()` 提供基本的路由列表（method + path）。没有从路由元数据、参数类型、响应 schema 等自动生成 API 文档的能力。

主流框架：
- **NestJS**：`@nestjs/swagger` 通过装饰器生成完整的 OpenAPI 规范
- **Fastify**：`@fastify/swagger` + `@fastify/swagger-ui`，基于 JSON Schema
- **Hono**：`@hono/zod-openapi`

**决定**：不做。实现成本高（TypeScript 运行时无类型信息，需大量额外装饰器标注 schema），且替代方案更实用（手写 OpenAPI YAML、Postman、`HttpInspector.list_router()` 等）。适合框架成熟后再考虑。

---

### 12. 声明式 DTO 验证管道

**状态**：部分实现

`@tarpit/judge` 提供 `Judgement` 基类，支持 `ensure()` / `get_if()` 运行时验证。`JsonBody`、`FormBody`、`PathArgs`、`Params` 都继承自 `Judgement`。功能可用但偏命令式——验证逻辑在 handler 代码中而非声明在 DTO 上。

主流对比：
- **NestJS**：DTO 类上使用 `class-validator` 装饰器 + 全局 `ValidationPipe` 在 handler 执行前自动验证
- **Fastify**：路由定义上的 JSON Schema 自动验证请求
- **Hono**：`@hono/zod-validator` 进行 Zod schema 验证

当前方案可用且有显式的优点。代价是复杂验证场景下样板代码更多。

**决定**：不做。当前 `Judgement` + `Jtl` 的命令式验证（`body.ensure('name', Jtl.non_empty_string)`）已覆盖运行时验证需求，一行一个字段，清晰直接。声明式 DTO 验证只是换种写法，不增加新能力，但实现成本极高（需设计装饰器体系、pre-handler 验证阶段、大幅扩展 Matcher 体系）。

---

### 13. Session 管理

**状态**：缺失

`HttpSession` 接口目前只有 `process_start`——这是请求内部状态，不是 session 管理系统。没有 session store、session ID 或 session 中间件。

主流框架：
- **Express**：`express-session`，可插拔 store（memory、Redis、DB）
- **Fastify**：`@fastify/session` / `@fastify/secure-session`
- **NestJS**：委托给 Express/Fastify 的 session 中间件

**缓解方案**：现代 API 通常使用无状态 JWT 认证代替 session。对于 API 优先的框架，session 管理可能不是必需的。

**决定**：不做。tarpit 定位 API 框架，现代 API 使用无状态 JWT 认证，不需要 session 管理。

---

## 优先级总结

### 已完成

| 功能 | 说明 |
|------|------|
| PATCH 方法 | `@Patch` 装饰器，OPTIONS/Allow 头更新 |
| 响应压缩（gzip/br） | `flush_response.ts` 流式压缩，可配置 |
| CORS 增强 | credentials、expose_headers、多 origin 精确匹配 |

### 待实现

| 优先级 | 功能 | 工作量 | 影响 |
|--------|------|--------|------|
| P1 | Multipart 文件上传 | 大 | 文件上传基本能力 |

### 决定待定

| 功能 | 原因 |
|------|------|
| 路由级 middleware/拦截器 | 当前机制已覆盖大部分场景，观察是否有无法满足的实际需求 |

### 决定不做

| 功能 | 原因 |
|------|------|
| Cookie 支持 | API 框架不需要，用户可自行几行代码解决 |
| 限流 | 应由基础设施层处理 |
| Request ID | 用户可在 HttpHooks.on_init 中自行实现 |
| HTTPS 支持 | 应由反向代理/基础设施层处理 |
| HTML 错误页面 | API 框架不需要，可替换 HttpBodyFormatter 自定义 |
| OpenAPI/Swagger | 实现成本高，替代方案更实用 |
| 声明式 DTO 验证 | Judgement + Jtl 已覆盖需求，声明式只是换种写法 |
| Session 管理 | 现代 API 使用 JWT，不需要 session |

## 结论

HTTP 模块已有坚实的基础，覆盖了路由、请求体解析、WebSocket、认证、静态文件和缓存。经过逐项评估，确定实现 4 项功能：（1）PATCH 方法——已完成；（2）响应压缩——已完成，`flush_response` 中基于 zlib 流式压缩；（3）CORS 增强——已完成，补充 credentials、expose_headers、多 origin 精确匹配；（4）Multipart 文件上传——待实现，需整体设计流式解析方案。路由级 middleware 待定观察。其余 8 项不做，要么应由基础设施层处理（限流、HTTPS），要么用户可自行简单实现（Cookie、Request ID），要么投入产出比不合理（OpenAPI、声明式验证）。
