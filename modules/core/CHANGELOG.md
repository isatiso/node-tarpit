# @tarpit/core

## 2.2.0

### Minor Changes

- DAG-based lifecycle ordering for `@OnStart` and `@OnTerminate` hooks.

  - Add dependency-aware scheduling based on constructor injection graph
  - Add `TpLoader.record()` to register component dependency relationships
  - Add `TpLoader.register()` optional `deps` parameter for module-level dependencies
  - Replace flat `Promise.allSettled` with eager per-node execution respecting DAG order
  - Execute `@OnTerminate` hooks in reverse dependency order

## 2.0.1

### Patch Changes

- Fix class field initialization order in build output.

  - Fix tsup swc plugin not respecting `useDefineForClassFields: false`, which caused native class fields to be preserved in ESM output and field initializers to run before constructor parameter assignments

- Updated dependencies
  - @tarpit/config@2.0.1
  - @tarpit/type-tools@2.0.1

## 2.0.0

### Patch Changes

- 9bf475b: version alignment
- Updated dependencies [9bf475b]
  - @tarpit/type-tools@2.0.0
  - @tarpit/config@2.0.0

## 1.0.0

### Minor Changes

- ff6afdd: feat: modernize project toolchain and testing

  - Migrated the entire project's testing framework to Vitest for a unified and modern developer experience.
  - Upgraded the minimum Node.js requirement to v18 and the TypeScript build target to ES2022.
  - Refactored test container setup for `rabbitmq` and `mongodb` to improve stability and fix CI-specific errors.

### Patch Changes

- Updated dependencies [ff6afdd]
  - @tarpit/type-tools@0.6.0
  - @tarpit/config@0.6.0

## 0.5.80

### Patch Changes

- bb0d75f: Refactor CI/CD pipeline to use Changesets for versioning and publishing.
