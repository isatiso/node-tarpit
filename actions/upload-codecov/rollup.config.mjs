/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import typescript from '@rollup/plugin-typescript'
import builtinModules from 'builtin-modules'
import fs from 'node:fs'
import dts from 'rollup-plugin-dts'
import ts from 'typescript'

const pkg = JSON.parse(fs.readFileSync('./package.json').toString('utf-8'))

const external = [
    ...builtinModules,
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
]

// noinspection JSUnusedGlobalSymbols
export default [
    {
        input: 'src/index.ts',
        output: { file: 'lib/index.mjs', format: 'es', interop: 'auto' },
        external,
        plugins: [
            typescript({ removeComments: true }),
        ]
    },
    {
        input: 'src/index.ts',
        output: { file: 'lib/index.d.ts', format: 'es' },
        external,
        plugins: [
            dts({ compilerOptions: { removeComments: true, paths: {}, module: ts.ModuleKind.ESNext } }),
        ]
    },
]
