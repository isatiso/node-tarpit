/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { program } from 'commander'
import { do_clean_mission } from './__tools__'

import { PackageJson } from './__types__'
import { action_cover } from './action/cover'

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

    const signal_handler = (signal: any, code: any) => {
        console.log(`Stopped by signal ${signal}(${code}).`)
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
