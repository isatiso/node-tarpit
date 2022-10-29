/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { InputOptions, MergedRollupOptions, OutputOptions, Plugin } from 'rollup'

export function create_render_process(input: string, output: OutputOptions[], plugins: Plugin[], options?: InputOptions): MergedRollupOptions {
    return { ...options, input, plugins, output }
}

export function output_js(file_cjs: string, file_mjs: string): OutputOptions[] {
    const res: OutputOptions[] = []
    file_cjs && res.push({ file: file_cjs, format: 'cjs', interop: 'auto' })
    file_mjs && res.push({ file: file_mjs, format: 'es', interop: 'auto' })
    return res
}

export function output_dts(file: string): OutputOptions[] {
    const res: OutputOptions[] = []
    file && res.push({ file: file, format: 'es', interop: 'auto' })
    return res
}
