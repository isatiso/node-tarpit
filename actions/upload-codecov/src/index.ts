import * as core from '@actions/core'
import * as fs from 'fs'
import * as https from 'https'
import * as path from 'path'

import * as exec from '@actions/exec'

import { build_exec } from './build-exec'
import {
    get_base_url,
    set_failure,
} from './helpers'

import verify from './validate'
import versionInfo from './version'

let failCi

try {
    const { exec_args, options, failCi, uploader_version } = build_exec()

    const platform = process.env.RUNNER_OS?.toLowerCase() ?? 'linux'
    core.info(`==> ${process.env.RUNNER_OS?.toLowerCase() ?? 'unknown'} OS detected`)

    const filename = path.join(__dirname, 'codecov')
    https.get(get_base_url(platform, uploader_version), res => {
        // Image will be stored at this path
        const filePath = fs.createWriteStream(filename)
        res.pipe(filePath)
        filePath
            .on('error', (err) => {
                set_failure(
                    `Codecov: Failed to write uploader binary: ${err.message}`,
                    true,
                )
            }).on('finish', async () => {
            filePath.close()

            await verify(filename, platform, uploader_version, verbose, failCi)
            await versionInfo(platform, uploader_version)
            await fs.chmodSync(filename, '777')

            const unlink = () => {
                fs.unlink(filename, (err) => {
                    if (err) {
                        set_failure(
                            `Codecov: Could not unlink uploader: ${err.message}`,
                            failCi,
                        )
                    }
                })
            }
            await exec.exec(filename, exec_args, options)
                .catch((err) => {
                    set_failure(
                        `Codecov: Failed to properly upload: ${err.message}`,
                        failCi,
                    )
                }).then(() => {
                    unlink()
                })
        })
    })
} catch (err) {
    set_failure(`Codecov: Encountered an unexpected error ${err.message}`, failCi)
}
