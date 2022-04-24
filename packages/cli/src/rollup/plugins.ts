import fg from 'fast-glob'
import fs from 'fs'
import { Plugin } from 'rollup'
import _dts from 'rollup-plugin-dts'
import _rpt2 from 'rollup-plugin-typescript2'
import ttypescript from 'ttypescript'
import ts from 'typescript'

export function merge_dts(glob?: string | ReadonlyArray<string>): Plugin {
    const glob_pattern = glob ? typeof glob === 'string' ? [glob] : glob.slice() : ['./src/**/*.d.ts']
    return {
        name: 'merge .d.ts files',
        renderChunk(code: string) {
            const dts_content = fg.sync(glob_pattern)
                .map(f => `// merge from ${f}\n${fs.readFileSync(f, 'utf8').trim()}`)
                .join('\n\n')
            return dts_content + '\n\n// ---------- divider ----------\n' + code
        }
    }
}

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
