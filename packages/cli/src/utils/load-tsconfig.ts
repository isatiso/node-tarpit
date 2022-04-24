import path from 'path'
import ts from 'typescript'
import process from 'process'

export function find_tsconfig(dir?: string) {
    dir = dir ? path.resolve(dir) : process.cwd()
    const config_path = ts.findConfigFile(dir, ts.sys.fileExists, 'tsconfig.json')
    if (!config_path) {
        throw new Error('tsconfig.json not found')
    }
    return config_path
}

export function read_tsconfig(dir?: string): {
    extends?: string
    compilerOptions: any
    include?: string[]
    exclude?: string[]
} {
    const config_path = find_tsconfig(dir)
    const { config } = ts.readConfigFile(config_path, ts.sys.readFile)
    return config
}

export function parse_tsconfig(config?: any, dir?: string): ts.CompilerOptions {
    dir = dir ? path.resolve(dir) : process.cwd()
    config = config ?? read_tsconfig(dir)
    const { options } = ts.parseJsonConfigFileContent(config, ts.sys, dir)
    return options
}
