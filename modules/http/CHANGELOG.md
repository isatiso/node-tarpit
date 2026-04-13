# @tarpit/http

## 2.1.1

### Patch Changes

- Fix class field initialization order in build output.

  - Fix tsup swc plugin not respecting `useDefineForClassFields: false`, which caused native class fields to be preserved in ESM output and field initializers to run before constructor parameter assignments

- Updated dependencies
  - @tarpit/config@2.0.1
  - @tarpit/content-type@2.0.1
  - @tarpit/core@2.0.1
  - @tarpit/dora@2.0.1
  - @tarpit/judge@2.0.1
  - @tarpit/negotiator@2.0.1

## 2.1.0

### Minor Changes

- Add PATCH method, response compression, and CORS enhancements.

  - Add `@Patch` decorator and `'PATCH'` to `ApiMethod`, update OPTIONS/Allow header generation
  - Add response compression (gzip/br) in `flush_response` via Node.js built-in `zlib`, configurable via `http.compression`
  - Add CORS `credentials`, `expose_headers`, and exact multi-origin matching support; extend `allow_origin` to accept string arrays

## 2.0.0

### Patch Changes

- 9bf475b: version alignment
- Updated dependencies [9bf475b]
  - @tarpit/negotiator@2.0.0
  - @tarpit/config@2.0.0
  - @tarpit/judge@2.0.0
  - @tarpit/dora@2.0.0
  - @tarpit/content-type@2.0.0
  - @tarpit/core@2.0.0

## 1.0.0

### Minor Changes

- ff6afdd: feat: modernize project toolchain and testing

  - Migrated the entire project's testing framework to Vitest for a unified and modern developer experience.
  - Upgraded the minimum Node.js requirement to v18 and the TypeScript build target to ES2022.
  - Refactored test container setup for `rabbitmq` and `mongodb` to improve stability and fix CI-specific errors.

### Patch Changes

- Updated dependencies [ff6afdd]
  - @tarpit/content-type@1.0.0
  - @tarpit/negotiator@0.6.0
  - @tarpit/config@0.6.0
  - @tarpit/judge@0.6.0
  - @tarpit/dora@0.6.0
  - @tarpit/core@1.0.0

## 0.5.80

### Patch Changes

- Updated dependencies [bb0d75f]
  - @tarpit/core@0.5.80
  - @tarpit/content-type@0.5.80
