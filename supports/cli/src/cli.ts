/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { program } from 'commander'

import { do_clean_mission } from './tools'

import { action_cover } from './action/cover'
import { action_docs } from './action/docs'

interface Person {
    name?: string | undefined;
    email?: string | undefined;
    url?: string | undefined;
}

interface Package {
    [k: string]: any;

    name: string;
    version: string;
    files?: string[] | undefined;
    bin?: { [k: string]: string } | undefined;
    man?: string[] | undefined;
    keywords?: string[] | undefined;
    author?: Person | undefined;
    maintainers?: Person[] | undefined;
    contributors?: Person[] | undefined;
    bundleDependencies?: { [name: string]: string; } | undefined;
    dependencies?: { [name: string]: string; } | undefined;
    devDependencies?: { [name: string]: string; } | undefined;
    optionalDependencies?: { [name: string]: string; } | undefined;
    description?: string | undefined;
    engines?: { [type: string]: string } | undefined;
    license?: string | undefined;
    repository?: { type: string, url: string } | undefined;
    bugs?: { url: string, email?: string | undefined } | { url?: string | undefined, email: string } | undefined;
    homepage?: string | undefined;
    scripts?: { [k: string]: string } | undefined;
    readme: string;
    _id: string;
}

export type PackageJsonWorkspacePackageList = string[]

export interface PackageJsonWorkspace {
    packages?: PackageJsonWorkspacePackageList
    nohoist?: string[]
}

export interface PackageJson extends Package {
    workspaces?: PackageJsonWorkspacePackageList | PackageJsonWorkspace
}

export async function create_cli(package_json: PackageJson) {

    const cli = program.version(package_json.version)
        .option('--config <file>', '指定配置文件, 默认会查找 package.json 同级的 tt-cli.json')
        .option('--show-error-detail', '是否展示详细错误信息')
        .option('--workdir <workdir>', '工作目录')

    cli.command('cover')
        .option('-c, --clean', '清除缓存文件')
        .option('--no-clean', '不清除缓存文件')
        .option('-r, --reporter <reporter...>', '设置 reporter')
        .action(action_cover)

    cli.command('docs')
        .action(action_docs)

    const signal_handler = (signal: any, code: any) => {
        console.info(`Stopped by signal ${signal}(${code}).`)
        do_clean_mission()
        process.exit(code)
    }

    process.on('SIGINT', signal_handler)
    process.on('SIGTERM', signal_handler)

    try {
        await cli.parseAsync(process.argv)
    } catch (e) {
        console.error(e)
        process.exit(255)
    } finally {
        do_clean_mission()
    }
}
