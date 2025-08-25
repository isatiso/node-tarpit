---
"@tarpit/worker-threads": minor
"@tarpit/content-type": minor
"@tarpit/transformer": minor
"@tarpit/router-test": minor
"@tarpit/negotiator": minor
"@tarpit/type-tools": minor
"@tarpit/barbeque": minor
"@tarpit/rabbitmq": minor
"@tarpit/schedule": minor
"@tarpit/mongodb": minor
"@tarpit/config": minor
"@tarpit/judge": minor
"@tarpit/cron": minor
"@tarpit/dora": minor
"@tarpit/core": minor
"@tarpit/http": minor
"@tarpit/cli": minor
---

feat: modernize project toolchain and testing

- Migrated the entire project's testing framework to Vitest for a unified and modern developer experience.
- Upgraded the minimum Node.js requirement to v18 and the TypeScript build target to ES2022.
- Refactored test container setup for `rabbitmq` and `mongodb` to improve stability and fix CI-specific errors.

