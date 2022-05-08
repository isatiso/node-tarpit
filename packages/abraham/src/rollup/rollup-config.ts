import json from '@rollup/plugin-json'
import fs from 'fs'
import path from 'path'
import { InputOptions } from 'rollup'
import { CompilerOptions } from 'typescript'
import { PackageJson } from '../types'
import { parse_tsconfig, read_json_file_sync, read_tsconfig } from '../__tools__'
import { clean, dts, rpt2 } from './plugins'
import { create_render_process, output_dts, output_js } from './render'
import { gen_external } from './utils'

export class RollupConfig {

    public readonly externals: ReadonlyArray<string | RegExp>
    public readonly declarationDir: string
    public readonly outDir: string
    public readonly package_json: PackageJson
    public readonly compiler_options: CompilerOptions
    public readonly rpt2CacheRoot: string
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
        this.rpt2CacheRoot = this.options.rpt2CacheRoot ?? '__rpt2_cache'
        this._inputOptions = this.options.inputOptions ?? {}
    }

    add_input_options<K extends keyof InputOptions>(k: K, v: InputOptions[K]) {
        this._inputOptions[k] = v
    }

    create(input: string, dts?: boolean) {
        if (!dts) {
            return [
                this.render_js(input),
            ]
        } else {
            return [
                this.render_js_with_dts(input),
                this.render_dts(path.join(this.declarationDir, input).replace(/\.ts$/, '.d.ts')),
            ]
        }
    }

    dry_run(input: string) {
        return create_render_process(input, [],
            [
                json(),
                rpt2({}, this.rpt2CacheRoot)
            ],
            { external: this.externals.slice(), ...this._inputOptions })
    }

    private render_js(input: string) {
        return create_render_process(
            input,
            output_js(
                path.join(this.outDir, 'index.js'),
                path.join(this.outDir, 'index.esm.js'),
            ),
            [
                json(),
                rpt2({}, this.rpt2CacheRoot),
            ], { external: this.externals.slice(), ...this._inputOptions })
    }

    private render_js_with_dts(input: string) {
        return create_render_process(
            input,
            output_js(
                path.join(this.outDir, 'index.js'),
                path.join(this.outDir, 'index.esm.js'),
            ),
            [
                json(),
                rpt2({
                    declaration: true,
                    declarationDir: this.declarationDir,
                }, this.rpt2CacheRoot),
            ], { external: this.externals.slice(), ...this._inputOptions })
    }

    private render_dts(input: string) {
        return create_render_process(
            input,
            output_dts(
                path.join(this.outDir, 'index.d.ts'),
            ),
            [
                clean(this.declarationDir),
                dts(),
            ], { external: this.externals.slice(), ...this._inputOptions })
    }
}
