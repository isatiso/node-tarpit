/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import * as core from '@actions/core'
import * as exec from '@actions/exec'
import axios from 'axios'
import fs from 'fs'
import path from 'path'

import { build_exec } from './build-exec'
import { get_base_url, set_failure, } from './helpers'

import verify from './validate'

export async function main() {
    const uploader_version = 'latest'
    const platform = process.env.RUNNER_OS?.toLowerCase() ?? 'linux'
    core.info(`==> ${process.env.RUNNER_OS?.toLowerCase() ?? 'unknown'} OS detected`)

    const filename = path.join(__dirname, 'codecov')
    await axios.get(get_base_url(platform, uploader_version), { responseType: 'arraybuffer' })
        .then(res => fs.writeFileSync(filename, res.data))
        .catch(err => set_failure(`Codecov: Failed to write uploader binary: ${err.message}`))

    await verify(filename, platform, uploader_version)

    try {
        const metadata = await axios.get<any>('https://uploader.codecov.io/linux/latest', { headers: { 'Accept': 'application/json' } })
            .then(res => res.data)
        core.info(`==> Running version ${metadata.version}`)
    } catch (err) {
        core.info(`Could not pull latest version information: ${err}`)
    }

    await fs.chmodSync(filename, '777')

    const { exec_list, options } = build_exec()
    for (const args of exec_list) {
        await exec.exec(filename, args.split(' '), options).catch((err) => set_failure(`Codecov: Failed to properly upload: ${err.message}`))
    }

    fs.unlinkSync(filename)
}

if (require.main === module) {
    main().then()
}
