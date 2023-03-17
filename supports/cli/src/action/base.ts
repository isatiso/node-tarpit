/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Command, program } from 'commander'
import { camelcase } from '../tools'
import { CliOptions } from '../cli.type'
import { ConfigLoader } from '../config-loader'

export function make_action<K extends keyof CliOptions, T extends CliOptions[K]>(action_name: string, callback: (options: T, config: ConfigLoader) => Promise<void>) {
    return async (options: T, command: Command) => {
        const start = Date.now()
        const workdir = program.opts().workdir
        workdir && process.chdir(workdir)
        const config = ConfigLoader.load({ [camelcase(command.name())]: options }, program.opts().config)
        await callback(options, config)
        console.info(`Action ${action_name} done in ${(Date.now() - start) / 1000}s.`)
    }
}
