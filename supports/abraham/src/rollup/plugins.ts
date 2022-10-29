/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import _rpt from '@rollup/plugin-typescript'
import { execSync, spawnSync } from 'child_process'
import fs from 'fs'
import { Plugin } from 'rollup'
import _dts from 'rollup-plugin-dts'
import ts, { CompilerOptions } from 'typescript'

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

export function gen_dts(dir: string): Plugin {
    return {
        name: 'generate .d.ts files',
        buildStart() {
            // const start = Date.now()
            // spawnSync(`tsc --declaration --emitDeclarationOnly --declarationDir ${dir}`)
            // console.log(Date.now() - start)

        }
    }
}

export function rpt(declarationDir?: string) {
    return _rpt({ removeComments: true, paths: {} })
}

export function dts(options: CompilerOptions) {
    options.declaration = true
    return _dts({ compilerOptions: { ...options, removeComments: true, paths: {}, module: ts.ModuleKind.ESNext } })
}
