/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { deliver_shell, register_clean_files } from '../__tools__'
import { CliOptions } from '../cli.type'
import { make_action } from './__base__'

export const action_cover = make_action('cover', async (cli_options: CliOptions['cover'], config) => {

    let reporter = '--reporter=text'
    if (config.get('cover.reporter')) {
        reporter += ' --reporter=' + config.get('cover.reporter')
    }

    await deliver_shell(`nyc --cache-dir=.cache -e='.ts' -n 'src/**/*.ts' -x 'src/**/*.spec.ts' -i source-map-support/register -i @tarpit/cli/script/register ${reporter} mocha src/**/*.spec.ts`,)
        .catch(err => console.log(err))

    if (config.get('cover.clean')) {
        register_clean_files('./.nyc_output')
        register_clean_files('./.cache')
    }
})
