/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import fs from 'fs'
import { Plugin } from 'rollup'
import _dts from 'rollup-plugin-dts'
import { terser as _terser } from 'rollup-plugin-terser'
import _rpt2 from 'rollup-plugin-typescript2'
import ttypescript from 'ttypescript'
import ts from 'typescript'

export function clean(dir: string): Plugin {
    return {
        name: 'clean temp files',
        buildEnd() {
            if (fs.existsSync(dir)) {
                fs.rmSync(dir, { recursive: true })
            }
        }
    }
}

export function rpt2(override: ts.CompilerOptions, cacheRoot?: string) {
    return _rpt2({
        useTsconfigDeclarationDir: true,
        tsconfigOverride: {
            compilerOptions: {
                ...override,
                module: 'esnext',
                paths: null,
                rootDir: './',
                removeComments: true,
            }
        },
        cacheRoot,
        typescript: ttypescript,
        clean: true,
    })
}

export function dts() {
    return _dts({ compilerOptions: { paths: {}, module: ts.ModuleKind.ESNext } })
}

export function terser() {
    return _terser({
        ecma: 2020,
        format: { comments: false }
    })
}
