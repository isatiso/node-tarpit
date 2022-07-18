/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { deliver_shell, register_clean_files } from '../__tools__'
import { CliOptions } from '../cli.type'
import { ConfigLoader } from '../scripts/config-loader'
import { make_action } from './__base__'

export const action_cover = make_action('cover', async (cli_options: CliOptions['cover'], config) => {

    await deliver_shell(
        `nyc -a` +
        ` --cache-dir=.cache` +
        ` -n 'src/**/*.ts'` +
        ` -x 'src/**/*.spec.ts'` +
        ` -i source-map-support/register` +
        ` -i @tarpit/cli/script/register` +
        ` ${get_reporter(config)}` +
        ` mocha './**/*.spec.ts'`
    )

    if (config.get('cover.clean')) {
        register_clean_files('./.nyc_output')
        register_clean_files('./.cache')
    }
})

function get_reporter(config: ConfigLoader) {
    const reporter = config.get('cover.reporter')
    if (!reporter) {
        return '--reporter=text-summary'
    } else if (Array.isArray(reporter)) {
        return reporter.map(r => '--reporter=' + r).join(' ')
    } else {
        return '--reporter=' + reporter
    }
}
