<p>
    <img src="https://www.tarpit.cc/assets/tarpit.svg" alt="tarpit" height="60">
</p>

🥦 Simple but Awesome [TypeScript](https://www.typescriptlang.org/) DI Framework for Node.js 🥦

[![build:?][build badge]][build link]
[![coverage:?][coverage badge]][coverage link]
[![license:mit][license badge]][license link]
[![downloads:?][downloads badge]][downloads link]
[![node:?][node badge]][node link]

---

Tarpit is a Dependency Injection (DI) Framework, built-on TypeScript.
As a platform, we can build reusable, testable and maintainable applications on it.

Simply, Tarpit collects services and puts them where you declare them by specifying the constructor parameter type.

Get more -> [Document](https://www.tarpit.cc/)

## Quick Start

To use Tarpit framework you should be familiar with the following:

- [Node.js](https://nodejs.org/dist/latest-v16.x/docs/api/) with its package manager NPM
- [TypeScript](https://www.typescriptlang.org/)

Assuming you’ve already installed Node.js and TypeScript,
create a directory to hold your application, and make that your working directory.

```shell
$ mkdir myapp
$ cd myapp
```

Use the `npm init` command to create a `package.json` file for your application.
For more information on how `package.json` works, see [Specifics of npm’s package.json handling](https://docs.npmjs.com/cli/v8/configuring-npm/package-json).

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

To start, you can use `tsc` to compile it to JavaScript and run it by `node ./index.js`.

Or directly use `ts-node ./index.ts`.

```shell
$ ts-node ./index.ts
# Tarpit server started at 2022-XX-XXTXX:XX:XX.XXXZ, during 0.001s
```

Let’s test the API with the following code:

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

[build badge]: https://img.shields.io/github/workflow/status/isatiso/node-tarpit/node-tarpit-main?style=flat-square
[build link]: https://github.com/isatiso/node-tarpit/actions/workflows/main.yml
[coverage badge]: https://img.shields.io/codecov/c/github/isatiso/node-tarpit?style=flat-square
[coverage link]: https://app.codecov.io/gh/isatiso/node-tarpit
[license badge]: https://img.shields.io/npm/l/@tarpit/core?style=flat-square
[license link]: https://github.com/isatiso/node-tarpit/blob/main/LICENSE
[downloads badge]: https://img.shields.io/npm/dm/@tarpit/core?style=flat-square
[downloads link]: https://www.npmjs.com/package/@tarpit/core
[node badge]: https://img.shields.io/node/v-lts/@tarpit/core?style=flat-square
[node link]: https://www.npmjs.com/package/@tarpit/core

