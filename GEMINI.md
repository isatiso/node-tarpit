# Project Guidelines

## General

1. Use **pnpm** as the package manager. **Do not use npm or yarn**.
2. Use **snake\_case** for all function and variable names, including local, global, and exported symbols.
3. Prefix all **private variables** with an underscore (`_`).
4. **Avoid comments unless absolutely necessary.** Prefer self-explanatory code.
5. Use **Chinese** for all conversations.
6. Use **English** in all source code and project files, **including this document (`GEMINI.md`)**.
7. **Do not execute or simulate running any code unless explicitly instructed.**
8. Do **not** use semicolons in any JavaScript or TypeScript files.
9. For unhandled Promises (i.e., "fire-and-forget" operations), explicitly mark them with the `void` operator to make the intention clear.
10. Follow the configuration defined in `.editorconfig` when writing code.
    * This includes using an **indent size of 4 spaces**.
11. For dependency-injected services, the private variable name can be shortened by omitting the `_service` suffix if the name remains unambiguous (e.g.,
    `private _evaluation_service: EvaluationService` can be written as `private _evaluation: EvaluationService`).

