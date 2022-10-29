/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import _rpt from '@rollup/plugin-typescript'
import fs from 'fs'
import { Plugin } from 'rollup'
import _dts from 'rollup-plugin-dts'
import ts, { CompilerOptions } from 'typescript'

export const rpt = (): Plugin => _rpt({ removeComments: true, paths: {} })

export const dts = (options: CompilerOptions): Plugin => _dts({
    compilerOptions: { ...options, declaration: true, removeComments: true, paths: {}, module: ts.ModuleKind.ESNext }
})

export const clean = (dir: string): Plugin => ({
    name: 'clean temp files',
    buildEnd: () => {
        fs.existsSync(dir) && fs.rmSync(dir, { recursive: true })
    }
})
