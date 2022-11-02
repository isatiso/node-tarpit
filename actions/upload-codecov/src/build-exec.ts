import * as core from '@actions/core'
import * as github from '@actions/github'

import { version } from '../package.json'

const context = github.context

const is_true = (variable: string) => {
    return ['1', 't', 'true', 'y', 'yes'].includes(variable.toLowerCase())
}

export const build_exec = () => {
    const env_vars = core.getInput('env_vars')
    const fail_ci = is_true(core.getInput('fail_ci_if_error'))
    const file = core.getInput('file')
    const files = core.getInput('files')
    const flags = core.getInput('flags')
    const name = core.getInput('name')
    const os = core.getInput('os')
    const token = core.getInput('token')

    const exec_args = ['-n', `${name}`, '-Q', `github-action-${version}`]

    const options: any = {}
    options.env = Object.assign(process.env, {
        GITHUB_ACTION: process.env.GITHUB_ACTION,
        GITHUB_RUN_ID: process.env.GITHUB_RUN_ID,
        GITHUB_REF: process.env.GITHUB_REF,
        GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY,
        GITHUB_SHA: process.env.GITHUB_SHA,
        GITHUB_HEAD_REF: process.env.GITHUB_HEAD_REF || '',
    })

    const env_vars_arg = []
    for (const env_var of env_vars.split(',')) {
        const env_var_clean = env_var.trim()
        if (env_var_clean) {
            options.env[env_var_clean] = process.env[env_var_clean]
            env_vars_arg.push(env_var_clean)
        }
    }

    if (token) {
        options.env.CODECOV_TOKEN = token
    }
    if (fail_ci) {
        exec_args.push('-Z')
    }
    if (file) {
        exec_args.push('-f', `${file}`)
    }
    if (files) {
        files.split(',').map((f) => f.trim()).forEach((f) => {
            exec_args.push('-f', `${f}`)
        })
    }
    if (flags) {
        flags.split(',').map((f) => f.trim()).forEach((f) => {
            exec_args.push('-F', `${f}`)
        })
    }

    const uploader_version = 'latest'

    return { exec_args, options, failCi: fail_ci, os, uploader_version }
}
