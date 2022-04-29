import fs from 'fs'
import { Plugin } from 'rollup'
import _dts from 'rollup-plugin-dts'
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
