---
sidebar_position: 1
title: DI 差距分析
---

# DI 框架差距分析

对比 NestJS、InversifyJS、tsyringe、Angular DI、awilix 等主流框架的分析结果。

## 当前已实现的核心功能

- ClassProvider（singleton）/ ValueProvider（支持 `multi: true`）/ FactoryProvider（transient）
- 构造函数注入 + `@Inject` + `@Optional` 装饰器
- 父子层级 Injector（`@TpRoot` 实现作用域隔离）
- `@TpModule` 模块系统（providers + imports）
- `@OnStart` / `@OnTerminate` 生命周期钩子
- 运行时循环依赖检测
- Decorator 继承体系（`make_decorator` / `make_abstract_decorator`，便于框架扩展）
- Provider 覆盖（`Injector.set()` 使用 `Map.set()` 语义，后注册覆盖前者）
- 启动时依赖图校验（`TpAssembly` / `TpEntry` 在加载时立即 `create()`，触发完整依赖链解析）
- 类型安全注入（`Injector.get<T>(token: Constructor<T>)` 重载签名，class token 自动推断类型）
- 诊断工具（`inspect_injector()` 树形输出、`check_usage` 未使用 provider 检测、`detect_cycle_ref` 循环依赖检测）

## 与主流框架的差距评估

### 高优先级（均不需要做）

| 功能 | 决策 | 理由 |
|---|---|---|
| ~~Transient 作用域~~ | 不做 | ClassProvider 天然 singleton，FactoryProvider 天然 transient，两种 provider 类型已覆盖两种需求。需要缓存的工厂场景写包装 class 用 ClassProvider 注册即可。 |
| ~~Request 作用域~~ | 不做 | HTTP 模块已在请求闭包中手动创建 `TpRequest`/`HttpContext` 等请求级对象，不经过 Injector，天然实现请求级生命周期。如需在深层 service 访问请求上下文，可用 `AsyncLocalStorage` 传播。 |
| ~~异步 FactoryProvider~~ | 不做 | `@OnStart` 钩子已覆盖异步初始化场景，在 `Platform.start()` 阶段统一执行。改 `Provider.create()` 为异步返回会导致整个依赖解析链路异步化，属于破坏性变更，代价远大于收益。 |
| ~~动态模块~~ | 暂不做 | NestJS 的 `forRoot(config)` 本质是装饰器执行时传入硬编码常量，运行时配置仍需 `forRootAsync` + FactoryProvider。tarpit 的 `TpConfigData` + FactoryProvider 已能覆盖运行时配置需求。除非出现当前实现非常麻烦的具体场景，再考虑引入。 |
| ~~属性注入~~ | 不做 | 打破循环依赖应通过重构解决，减少构造函数参数是职责过重的代码气味。Angular 的 `inject()` 函数方案引入全局上下文依赖，混用增加心智负担，全面切换导致所有 class 无法脱离容器测试。构造函数注入是更干净的设计约束。 |

### 中优先级（均不需要做）

| 功能 | 决策 | 理由 |
|---|---|---|
| ~~ForwardRef~~ | 不做 | 本质是循环依赖问题，即使解决加载顺序，运行时实例化仍是死循环，需配合属性注入才能断开。既然属性注入不做，应通过重构消除循环依赖。 |
| ~~Provider 覆盖~~ | 已支持 | `Injector.set()` 使用 `Map.set()` 语义，后注册的同 token provider 直接覆盖前者。测试时 `platform.import({ provide: Token, useValue: mock })` 即可替换。 |
| ~~显式模块导出~~ | 不做 | tarpit 不面向超大型应用，所有 provider 对上层可见的设计足够简洁实用，无需引入 `exports: []` 增加配置复杂度。 |
| ~~惰性注入~~ | 不做 | ClassProvider 是 singleton 只创建一次，依赖树深度有限，启动性能不构成问题。条件分支依赖可通过 FactoryProvider 或拆分 service 解决。 |

### 低优先级（基本已实现）

| 功能 | 现状 | 差距 |
|---|---|---|
| 启动时依赖图校验 | `TpAssembly`/`TpEntry` 在加载时立即 `create()`，触发完整依赖链解析 | FactoryProvider 的 `deps` 引用不存在的 token 时不会提前报错（极少数场景） |
| 类型安全 Token | `Injector.get<T>()` 对 class token 已有类型推断 | string/symbol token 缺少 `InjectionToken<T>` 封装（极少使用） |
| 诊断工具 | `inspect_injector()` 树形输出、`check_usage` 函数、`detect_cycle_ref` 均已实现 | `check_usage` 未集成到启动流程，可视化格式可优化 |

## 结论

tarpit 的 DI 核心实现已覆盖主流框架的绝大多数功能，部分看似缺失的功能实际上通过不同的设计方式已经解决（如 FactoryProvider 天然 transient、HTTP 闭包天然 request scope、`@OnStart` 覆盖异步初始化）。与主流框架的差异更多是设计取舍而非功能缺失，当前设计在简洁性和实用性之间取得了合理的平衡。
