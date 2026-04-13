# @tarpit/type-tools

## 2.0.1

### Patch Changes

- Fix class field initialization order in build output.

  - Fix tsup swc plugin not respecting `useDefineForClassFields: false`, which caused native class fields to be preserved in ESM output and field initializers to run before constructor parameter assignments

## 2.0.0

### Major Changes

- 9bf475b: version alignment

## 0.6.0

### Minor Changes

- ff6afdd: feat: modernize project toolchain and testing

  - Migrated the entire project's testing framework to Vitest for a unified and modern developer experience.
  - Upgraded the minimum Node.js requirement to v18 and the TypeScript build target to ES2022.
  - Refactored test container setup for `rabbitmq` and `mongodb` to improve stability and fix CI-specific errors.
