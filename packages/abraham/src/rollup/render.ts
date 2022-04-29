import { InputOptions, MergedRollupOptions, OutputOptions, Plugin } from 'rollup'

export function create_render_process(input: string, output: OutputOptions[], plugins: Plugin[], options?: InputOptions): MergedRollupOptions {
    return { input, plugins, output, ...options }
}

export function output_js(file_cjs: string, file_mjs: string): OutputOptions[] {
    const res: OutputOptions[] = []
    file_cjs && res.push({ file: file_cjs, format: 'cjs' })
    file_mjs && res.push({ file: file_mjs, format: 'es' })
    return res
}

export function output_dts(file: string): OutputOptions[] {
    const res: OutputOptions[] = []
    file && res.push({ file: file, format: 'es' })
    return res
}
