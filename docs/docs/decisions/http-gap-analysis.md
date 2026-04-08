---
sidebar_position: 2
title: HTTP Gap Analysis
---

# HTTP Module Gap Analysis

Comparison with mainstream HTTP frameworks: NestJS, Fastify, Express/Koa, Hono.

## Core Features Already Implemented

- Decorator-based routing (`@Get`, `@Post`, `@Put`, `@Delete`, `@Route`, `@WS`)
- Route grouping `@TpRouter('/prefix')` with DI-driven parameter injection
- Path parameters (`path-to-regexp`) + query parameters (`Params`, `PathArgs`)
- Request body parsing (`JsonBody`, `FormBody`, `TextBody`, `RawBody`, `MimeBody`) with content-type negotiation
- Native WebSocket support (`@WS` decorator + `TpWebSocket` wrapper)
- Authentication framework (`@Auth` + replaceable `HttpAuthenticator`)
- Global CORS configuration (allow_origin, allow_methods, allow_headers, max_age)
- Static file serving (ETag, Last-Modified, Cache-Control, dotfile handling, file watching + LRU cache)
- File management service (read/write/streaming/tar.gz archive/file locking)
- Lifecycle hooks (`HttpHooks`: on_init, on_finish, on_error, on_ws_init, on_ws_close — replaceable via DI)
- Response caching (LRU-based `HttpCacheProxy` + `ResponseCache` + `@CacheUnder` decorator)
- Request body size limit (`http.body.max_length` config)
- Content negotiation (`@tarpit/negotiator`)
- Proxy support (X-Forwarded-For, X-Forwarded-Host, configurable ip_header)
- Graceful shutdown (terminate timeout + socket cleanup)
- Automatic HEAD request support (mapped to GET handler)
- Redirect support (`TpResponse.redirect()`)
- Streaming responses (Stream pipe to response)
- `@ContentType` decorator to specify response content type
- `@Disabled` decorator to disable routes
- Configurable keepalive timeout
- `HttpInspector` for route listing and programmatic route binding
- `HttpBodyFormatter` for error response content negotiation (JSON vs text)
- `Finish` / `TpHttpFinish` error model with typed throw helpers (`throw_bad_request`, `throw_not_found`, etc.)
- PATCH HTTP method (`@Patch` decorator)
- Response compression (gzip/br, stream-based via zlib, configurable threshold/encodings)
- CORS enhancements: credentials, expose_headers, exact multi-origin matching

## Gap Assessment

### 1. PATCH HTTP Method

**Status**: Done

Added `'PATCH'` to `ApiMethod`, created `@Patch` decorator, updated OPTIONS/Allow header generation.

---

### 2. Route-level Middleware / Interceptors

**Status**: Missing

Current `HttpHooks` provides global lifecycle hooks (on_init/on_finish/on_error) applied uniformly to all routes. The only customization path is replacing the entire `HttpHooks` service via DI. No mechanism exists for:
- Applying middleware to specific routes or route groups
- Chaining multiple middlewares (pipeline/onion model)
- NestJS-style layered concerns: Guards → Interceptors → Pipes → Exception Filters

Mainstream framework comparison:
- **Express/Koa**: `app.use()` / `router.use()` middleware chain
- **NestJS**: Guards, Interceptors, Pipes, Exception Filters — applicable at controller/route level
- **Fastify**: onRequest/preParsing/preValidation/preHandler/onSend/onResponse hooks, scope-limited to routes or plugins
- **Hono**: `app.use('/path', middleware)` composable middleware

**Decision**: Pending — the current approach of global replaceable services (`HttpHooks`, `HttpAuthenticator`) + route-level decorators (`@Auth`, `@CacheUnder`) + `TpRouter`-level provider injection already covers most middleware scenarios. Observe whether real use cases emerge that the current mechanism cannot satisfy.

---

### 3. Response Compression (gzip/brotli)

**Status**: Done

Implemented in `flush_response.ts` using Node.js built-in `zlib`. Selects encoding based on `Accept-Encoding` header (br preferred, gzip fallback). All body types go through the Stream branch; `Content-Length` is removed after compression. Skip conditions: `Content-Encoding` already set, `204`/`304` empty responses, body below threshold. Config: `http.compression` (enable, threshold, encodings).

---

### 4. CORS Configuration Enhancements

**Status**: Done

`credentials`, `expose_headers`, and exact multi-origin matching are all supported. `allow_origin` extended to a string array; the request `Origin` header is matched exactly and echoed back.

---

### 5. Cookie Parsing and Management

**Status**: Missing

**Decision**: Won't do. tarpit is positioned as an API framework; cookies are not a core requirement. Users can read via `request.get('Cookie')` and set via `response.set('Set-Cookie', ...)` in a few lines of code.

---

### 6. Rate Limiting

**Status**: Missing

**Decision**: Won't do. Rate limiting should be handled at the infrastructure layer (cloud gateway, reverse proxy, Redis). Application-layer rate limiting fails in multi-instance deployments, and malicious traffic should be intercepted before reaching the application.

---

### 7. Request ID / Correlation ID

**Status**: Missing

**Decision**: Won't do. Users can implement this in a few lines inside `HttpHooks.on_init`, with full flexibility over ID generation strategy, header name, and whether to accept externally provided IDs.

---

### 8. HTTPS / TLS Native Support

**Status**: Missing

**Decision**: Won't do. TLS termination should be handled by the infrastructure layer (reverse proxy nginx/caddy, cloud load balancer). Node.js applications should not be directly exposed to the internet.

---

### 9. HTML Error Page Templates

**Status**: Partially implemented (TODO in code)

`HttpBodyFormatter.format()` has a `// TODO: support html` comment. When the client prefers `text/html`, error responses fall back to plain text instead of rendering an HTML error page.

**Decision**: Won't do. tarpit is an API framework; clients receive JSON error responses. Users who need custom error formats (including HTML) can replace `HttpBodyFormatter`. The `// TODO: support html` comment in the code should be removed.

---

### 10. Multipart File Upload

**Status**: Pending — deeper design discussion needed

`MimeBody` exists but `multipart/form-data` has no registered deserializer in `ContentTypeModule`. The current body processing pipeline reads the entire request into a `Buffer` (`readable_to_buffer`), which would exhaust memory for large files.

Mainstream frameworks use busboy/multer/formidable for this.

**Key design question**: The `content-type` module's current abstraction is buffer-in/value-out — `MIMEContent<T>` requires `raw: Buffer` and all deserializer signatures are `(content: MIMEContent<any>) => any`. Multipart parsing requires streaming and cannot fit this model without either:

- **Option A**: Extend `content-type` with a separate `stream_deserializer_token` mechanism (cleaner long-term if other streaming content types emerge, but adds API complexity)
- **Option B**: Handle multipart entirely in the `http` layer, bypassing `ContentReaderService` for `multipart/form-data` requests (simpler, self-contained)

**Decision**: Pending — needs further discussion on streaming architecture before implementation.

---

### 11. OpenAPI / Swagger Documentation Generation

**Status**: Missing

**Decision**: Won't do. Implementation cost is high (no runtime type information in TypeScript, requires extensive additional decorator annotations for schema), and alternatives are more practical (hand-written OpenAPI YAML, Postman, `HttpInspector.list_router()`). Better considered after the framework matures.

---

### 12. Declarative DTO Validation Pipeline

**Status**: Partially implemented

`@tarpit/judge` provides the `Judgement` base class with `ensure()` / `get_if()` runtime validation. `JsonBody`, `FormBody`, `PathArgs`, `Params` all extend `Judgement`. Functional but imperative — validation logic lives in handler code rather than declared on DTOs.

**Decision**: Won't do. The current `Judgement` + `Jtl` imperative validation (`body.ensure('name', Jtl.non_empty_string)`) already covers runtime validation needs — one field per line, clear and direct. Declarative DTO validation is just a different style, adds no new capability, but has an extremely high implementation cost (requires designing a decorator system, pre-handler validation phase, and significantly expanding the Matcher system).

---

### 13. Session Management

**Status**: Missing

**Decision**: Won't do. tarpit is an API framework; modern APIs use stateless JWT authentication. Session management is not needed.

---

## Summary

### Done

| Feature | Notes |
|---------|-------|
| PATCH method | `@Patch` decorator, OPTIONS/Allow header updated |
| Response compression (gzip/br) | Stream-based via zlib in `flush_response`, configurable |
| CORS enhancements | credentials, expose_headers, multi-origin exact matching |

### Pending

| Feature | Reason |
|---------|--------|
| Multipart file upload | Requires deeper discussion on streaming architecture design |
| Route-level middleware/interceptors | Current mechanism covers most scenarios; observe for unmet real-world needs |

### Won't Do

| Feature | Reason |
|---------|--------|
| Cookie support | API framework; users can implement in a few lines |
| Rate limiting | Should be handled at infrastructure layer |
| Request ID | Users can implement in `HttpHooks.on_init` |
| HTTPS support | Should be handled by reverse proxy / infrastructure layer |
| HTML error pages | API framework; replace `HttpBodyFormatter` for custom formats |
| OpenAPI / Swagger | High implementation cost; alternatives are more practical |
| Declarative DTO validation | `Judgement` + `Jtl` already covers needs; declarative is just a style change |
| Session management | Modern APIs use JWT; session management not needed |
