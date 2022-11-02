import * as core from '@actions/core'

import { version } from '../package.json'

export function build_exec() {
    const name = core.getInput('name')
    const token = core.getInput('token')

    const exec_list = [
        `-n ${name} -Q github-action-${version} -f ./packages/barbeque/coverage/coverage-final.json -F barbeque -Z`,
        `-n ${name} -Q github-action-${version} -f ./packages/config/coverage/coverage-final.json -F config -Z`,
        `-n ${name} -Q github-action-${version} -f ./packages/dora/coverage/coverage-final.json -F dora -Z`,
        `-n ${name} -Q github-action-${version} -f ./packages/error/coverage/coverage-final.json -F error -Z`,
        `-n ${name} -Q github-action-${version} -f ./packages/judge/coverage/coverage-final.json -F judge -Z`,
        `-n ${name} -Q github-action-${version} -f ./modules/content-type/coverage/coverage-final.json -F content-type -Z`,
        `-n ${name} -Q github-action-${version} -f ./modules/core/coverage/coverage-final.json -F core -Z`,
        `-n ${name} -Q github-action-${version} -f ./modules/http/coverage/coverage-final.json -F http -Z`,
        `-n ${name} -Q github-action-${version} -f ./modules/schedule/coverage/coverage-final.json -F schedule -Z`,
        `-n ${name} -Q github-action-${version} -f ./modules/rabbitmq/coverage/coverage-final.json -F rabbitmq -Z`,
    ]

    const options: any = {}
    options.env = Object.assign(process.env, {
        GITHUB_ACTION: process.env.GITHUB_ACTION,
        GITHUB_RUN_ID: process.env.GITHUB_RUN_ID,
        GITHUB_REF: process.env.GITHUB_REF,
        GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY,
        GITHUB_SHA: process.env.GITHUB_SHA,
        GITHUB_HEAD_REF: process.env.GITHUB_HEAD_REF || '',
    })

    if (token) {
        options.env.CODECOV_TOKEN = token
    }

    return { exec_list, options }
}
