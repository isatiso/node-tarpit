/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import json from '@rollup/plugin-json'
import fs from 'fs'
import path from 'path'
import { InputOptions } from 'rollup'
import { CompilerOptions } from 'typescript'
import { read_json_file_sync } from '../tools/files'
import { parse_tsconfig, read_tsconfig } from '../tools/load-tsconfig'
import { PackageJson } from '../types'
import { dts, rpt } from './plugins'
import { create_render_process, output_dts, output_js } from './render'
import { gen_external } from './utils'

export class RollupConfig {

    public readonly externals: ReadonlyArray<string | RegExp>
    public readonly declarationDir: string
    public readonly outDir: string
    public readonly package_json: PackageJson
    public readonly compiler_options: CompilerOptions
    private readonly _inputOptions: InputOptions

    constructor(
        public readonly options: {
            readonly dts_glob?: string | ReadonlyArray<string>
            readonly externals?: ReadonlyArray<string | RegExp>
            readonly outDir?: string
            readonly declarationDir?: string
            readonly inputOptions?: Readonly<InputOptions>
            readonly rpt2CacheRoot?: string
        }
    ) {
        if (!fs.existsSync('./package.json')) {
            throw Error('package.json not found')
        }
        this.package_json = read_json_file_sync('./package.json')!
        this.compiler_options = parse_tsconfig(read_tsconfig())
        this.externals = gen_external(this.package_json, this.options.externals?.slice())
        this.outDir = this.options.outDir ?? this.compiler_options.outDir ?? path.resolve('./out')
        this.declarationDir = this.options.declarationDir ?? './__dts'
        this._inputOptions = this.options.inputOptions ?? {}
    }

    create(input: string, dts?: boolean) {
        const res = [this.render_js(input)]
        if (dts) {
            res.push(this.render_dts())
        }
        return res
    }

    private render_js(input: string) {
        return create_render_process(
            input,
            output_js(
                path.join(this.outDir, 'index.js'),
                path.join(this.outDir, 'index.mjs'),
            ),
            [json(), rpt('./__dts')],
            { external: this.externals.slice(), ...this._inputOptions })
    }

    private render_dts() {
        return create_render_process(
            'src/index.ts',
            output_dts(
                path.join(this.outDir, 'index.d.ts'),
            ),
            [
                // clean(this.declarationDir),
                // gen_dts(this.declarationDir),
                dts(this.compiler_options),
            ], { external: this.externals.slice(), ...this._inputOptions })
    }
}
