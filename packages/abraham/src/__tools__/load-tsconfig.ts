import path from 'path'
import process from 'process'
import ts from 'typescript'

export function find_tsconfig(dir?: string, config_name?: string) {

    dir = dir ? path.resolve(dir) : process.cwd()
    config_name = config_name ?? 'tsconfig.json'
    const config_path = ts.findConfigFile(dir, ts.sys.fileExists, config_name)
    if (!config_path) {
        throw new Error(`${config_name} not found.`)
    }
    return config_path
}

export function read_tsconfig(dir?: string, config_name?: string): {
    extends?: string
    compilerOptions: any
    include?: string[]
    exclude?: string[]
} {
    const config_path = find_tsconfig(dir, config_name)
    const { config } = ts.readConfigFile(config_path, ts.sys.readFile)
    return config
}

export function parse_tsconfig(config?: any, dir?: string, config_name?: string): ts.CompilerOptions {
    dir = dir ? path.resolve(dir) : process.cwd()
    config = config ?? read_tsconfig(dir, config_name)
    const { options } = ts.parseJsonConfigFileContent(config, ts.sys, dir)
    return options
}
