/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import builtinModules from 'builtin-modules'
import fs from 'fs'
import { Package } from 'normalize-package-data'
import path from 'path'
import ts from 'typescript'

export type PackageJsonWorkspacePackageList = string[]

export interface PackageJsonWorkspace {
    packages?: PackageJsonWorkspacePackageList
    nohoist?: string[]
}

export interface PackageJson extends Package {
    workspaces?: PackageJsonWorkspacePackageList | PackageJsonWorkspace
}

export function gen_external(pkg: PackageJson, external?: (string | RegExp)[]) {
    return [
        ...builtinModules,
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
        ...(external ?? []),
    ]
}

export function read_json_file_sync<T = any>(path: string): T | undefined {
    if (fs.existsSync(path)) {
        const json_file = (fs.readFileSync(path, 'utf-8') || '').trim()
        if (json_file) {
            try {
                return JSON.parse(json_file)
            } catch (e: any) {
                console.log(e.message)
                return
            }
        }
    }
    return
}

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
