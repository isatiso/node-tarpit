<p>
    <img src="https://www.tarpit.cc/img/tarpit.svg" alt="tarpit" height="60">
</p>

🥦 Simple but Awesome [TypeScript](https://www.typescriptlang.org/) DI Framework for Node.js 🥦

<!-- Metrics Badges (with numbers) -->
[![npm version][npm-version-badge]][npm-link]
[![monthly downloads][downloads-badge]][npm-link]
[![node version][node-badge]][npm-link]
[![coverage][coverage-badge]][coverage-link]
[![bundle size][bundle-size-badge]][bundle-size-link]
[![last commit][last-commit-badge]][github-link]

<!-- Status/Identity Badges (without numbers) -->
[![build status][build-badge]][build-link]
[![typescript][typescript-badge]][github-link]
[![license][license-badge]][license-link]
[![lerna][lerna-badge]][lerna-link]
[![ask deepwiki][deepwiki-badge]][deepwiki-link]

<!-- Social Badges -->
[![github stars][stars-badge]][github-link]
[![github forks][forks-badge]][forks-link]

---

Tarpit is a Dependency Injection (DI) Framework, built-on TypeScript.
As a platform, we can build reusable, testable and maintainable applications on it.

Simply, Tarpit collects services and puts them where you declare them by specifying the constructor parameter type.

Get more -> [Document](https://www.tarpit.cc/)

## Quick Start

To use Tarpit framework you should be familiar with the following:

- [Node.js](https://nodejs.org/dist/latest-v16.x/docs/api/) with its package manager NPM
- [TypeScript](https://www.typescriptlang.org/)

Assuming you've already installed Node.js and TypeScript,
create a directory to hold your application, and make that your working directory.

```shell
$ mkdir myapp
$ cd myapp
```

Use the `npm init` command to create a `package.json` file for your application.
For more information on how `package.json` works, see [Specifics of npm's package.json handling](https://docs.npmjs.com/cli/v8/configuring-npm/package-json).

```shell
$ npm init -y
```

Use the `tsc init` command to create a `tsconfig.json` file for your application.
For more information on how `tsconfig.json` works, see [Intro to the TSConfig Reference](https://www.typescriptlang.org/tsconfig).

```shell
$ tsc init
```

To use decorators and get the parameters' metadata, we should enable options `experimentalDecorators` and `emitDecoratorMetadata`.

```json5
// tsconfig.json
{
    // ...
    "experimentalDecorators": true,
    /* Enable experimental support for TC39 stage 2 draft decorators. */
    "emitDecoratorMetadata": true
    /* Emit design-type metadata for decorated declarations in source files. */
    // ...
}
```

We need to install the http package and its peer dependencies for primary usage.

```shell
$ npm install @tarpit/http $(node -p "Object.keys($(npm view @tarpit/http peerDependencies)).join(' ')")
```

Command `node -p "Object.keys($(npm view @tarpit/core peerDependencies)).join(' ')"` figure out the peer dependencies and consist them to space separate string.

## Hello World

As a pure DI Framework doesn't include any functional component, we do this with HTTP Server Module:

```typescript
import {Platform} from '@tarpit/core'
import {HttpServerModule, TpRouter, Get} from '@tarpit/http'

@TpRouter('/', {imports: [HttpServerModule]})
class FirstRouter {
    @Get()
    async hello() {
        return 'Hello World!'
    }
}

const platform = new Platform({http: {port: 3000}})
        .import(FirstRouter)
        .start()
```

The above code declares a router with base URL `'/'`, and an API with suffix `'hello-world'`.
After that, it creates a Platform instance and loads HttpServerModule and FirstRouter, and finally starts it.

For every other path, it will respond with a 404 Not Found.

To start, you can use `tsc` to compile it to JavaScript and run it by `node ./index.ts`.

Or directly use `ts-node ./index.ts`.

```shell
$ ts-node ./index.ts
# Tarpit server started at 2022-XX-XXTXX:XX:XX.XXXZ, during 0.001s
```

Let's test the API with the following code:

```shell
$ curl -X GET 'http://localhost:3000/hello'
# Hello World!
```

## Next steps

Guess you want to know about these things

- [Get more about DI mechanism and core concepts](https://www.tarpit.cc/1-core/)
- [Dig deep into HTTP Server](https://www.tarpit.cc/2-http-server)
- [Make crontab-style Schedule](https://www.tarpit.cc/3-rabbitmq-client)
- [Create Producer and Consumer base-on RabbitMQ](https://www.tarpit.cc/4-schedule/)

<!-- Badge Links -->
[npm-version-badge]: https://img.shields.io/npm/v/@tarpit/core
[downloads-badge]: https://img.shields.io/npm/dm/@tarpit/core
[node-badge]: https://img.shields.io/node/v/@tarpit/core
[coverage-badge]: https://codecov.io/gh/isatiso/node-tarpit/branch/main/graph/badge.svg?token=9S3UQPNS3Y
[bundle-size-badge]: https://img.shields.io/bundlephobia/minzip/@tarpit/core
[last-commit-badge]: https://img.shields.io/github/last-commit/isatiso/node-tarpit
[build-badge]: https://img.shields.io/github/check-runs/isatiso/node-tarpit/main
[typescript-badge]: https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white
[license-badge]: https://img.shields.io/github/license/isatiso/node-tarpit
[lerna-badge]: https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg
[deepwiki-badge]: https://deepwiki.com/badge.svg
[stars-badge]: https://img.shields.io/github/stars/isatiso/node-tarpit?style=social
[forks-badge]: https://img.shields.io/github/forks/isatiso/node-tarpit?style=social

[npm-link]: https://www.npmjs.com/package/@tarpit/core
[github-link]: https://github.com/isatiso/node-tarpit
[coverage-link]: https://codecov.io/gh/isatiso/node-tarpit
[bundle-size-link]: https://bundlephobia.com/package/@tarpit/core
[build-link]: https://github.com/isatiso/node-tarpit/actions/workflows/ci.yml
[license-link]: https://github.com/isatiso/node-tarpit/blob/main/LICENSE
[lerna-link]: https://lerna.js.org/
[deepwiki-link]: https://deepwiki.com/isatiso/node-tarpit
[forks-link]: https://github.com/isatiso/node-tarpit/network/members

