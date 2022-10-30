/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import fs from 'fs'
import path from 'path'
import { MergedRollupOptions } from 'rollup'
import { CompilerOptions } from 'typescript'
import { dts, json, rpt } from './plugins'
import { gen_external, parse_tsconfig, read_tsconfig } from './tools'

export class RollupConfig {

    public readonly externals: ReadonlyArray<string | RegExp>
    public readonly out_dir: string
    public readonly compiler_options: CompilerOptions

    constructor(
        public readonly options?: {
            readonly externals?: ReadonlyArray<string | RegExp>
            readonly out_dir?: string
            readonly declaration_dir?: string
        }
    ) {
        if (!fs.existsSync('./package.json')) {
            throw Error('package.json not found')
        }
        this.compiler_options = parse_tsconfig(read_tsconfig())
        this.externals = gen_external(this.options?.externals?.slice())
        this.out_dir = this.options?.out_dir ?? this.compiler_options.outDir ?? path.resolve('./lib')
    }

    create(input: string, dts?: boolean) {
        return dts
            ? [this._render_js(input), this._render_dts(input)]
            : [this._render_js(input)]
    }

    private _render_js = (input: string): MergedRollupOptions => ({
        input,
        output: [
            { file: path.join(this.out_dir, 'index.js'), format: 'cjs', interop: 'auto' },
            { file: path.join(this.out_dir, 'index.mjs'), format: 'es', interop: 'auto' },
        ],
        plugins: [json(), rpt()],
        external: this.externals.slice(),
    })

    private _render_dts = (input: string): MergedRollupOptions => ({
        input,
        output: [
            { file: path.join(this.out_dir, 'index.d.ts'), format: 'es', interop: 'auto' },
        ],
        plugins: [dts(this.compiler_options)],
        external: this.externals.slice(),
    })
}
