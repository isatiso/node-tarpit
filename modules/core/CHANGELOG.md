# @tarpit/core

## 1.0.1

### Patch Changes

- 7732ed2: fix version alignment
- Updated dependencies [7732ed2]
  - @tarpit/type-tools@1.0.1
  - @tarpit/config@1.0.1

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
