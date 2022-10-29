/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

// noinspection JSFileReferences
// const r = require('./out')
//
// exports.default = new r.RollupConfig({ outDir: './lib' }).create('./src/index.ts', true)

import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'
import ts from 'typescript'

export default [
    {
        input: 'src/index.ts',
        output: [
            { file: 'lib/index.js', format: 'cjs', interop: 'auto' },
            { file: 'lib/index.mjs', format: 'es' },
        ],
        plugins: [
            typescript({ removeComments: true }),
        ]
    },
    {
        input: 'src/index.ts',
        output: [
            { file: 'lib/index.d.ts', format: 'es' }
        ],
        plugins: [
            typescript({ removeComments: true }),
            dts({ compilerOptions: { removeComments: true, paths: {}, module: ts.ModuleKind.ESNext } }),
        ]
    },
]
