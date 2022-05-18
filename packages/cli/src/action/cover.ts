import { deliver_shell, register_clean_files } from '../__tools__'
import { CliOptions } from '../cli.type'
import { make_action } from './__base__'

export const action_cover = make_action('cover', async (cli_options: CliOptions['cover'], config) => {

    let reporter = ''
    if (config.get('cover.reporter')) {
        reporter = '--reporter=' + config.get('cover.reporter')
    }
    await deliver_shell(`env TS_NODE_COMPILER_OPTIONS='{"module": "commonjs" }' nyc -n 'src/**/*.ts' -x '**/*.spec.ts' ${reporter} mocha -r @tarpit/cli/script/register 'src/**/*.spec.ts'`,)
    if (config.get('cover.clean')) {
        register_clean_files('./.nyc_output')
        register_clean_files('./node_modules/.cache')
    }
})
