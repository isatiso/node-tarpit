/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ChildProcess, exec, spawn } from 'child_process'
import fs from 'fs'

const clean_board: string[] = []
const processing: Record<string, ChildProcess> = {}

export function register_clean_files(dir_or_file: string) {
    clean_board.push(dir_or_file)
}

export function do_clean_mission() {
    Promise.all(clean_board.map(f => deliver_shell(`rm -r ${f}`))).then(() => {
        Object.values(processing).forEach(c => c.kill(15))
    })
}

export async function deliver_shell(cmd_line: string, options?: {
    no_stdout?: boolean
    no_stderr?: boolean
}): Promise<string> {

    const error = new Error()

    function make_error(code: number) {
        error.message = `script returned exit code ${code}\n`
        return error
    }

    return new Promise<string>((resolve, reject) => {
        cmd_line = cmd_line.trim()
        process.stdout.write('tp> ' + cmd_line + '\n')

        const stdio = options?.no_stderr || options?.no_stdout ? 'pipe' : 'inherit'

        const child = spawn(cmd_line, { shell: '/bin/sh', stdio, })

        stdio === 'pipe' && !options?.no_stdout && child.stdout?.pipe(process.stdout)
        stdio === 'pipe' && !options?.no_stderr && child.stderr?.pipe(process.stderr)

        child.on('exit', () => child.exitCode
            ? reject(make_error(child.exitCode))
            : resolve(''))
    })
}

export async function command_exists(cmd: string) {
    cmd = cmd.trim()
    return new Promise<boolean>((resolve) => {
        const child = exec(`hash ${cmd} 2>/dev/null`)
        child.on('exit', () => {
            child.exitCode ? resolve(false) : resolve(true)
        })
    })
}

function read_text_file_sync(path: string) {
    return fs.readFileSync(path, 'utf-8')
}

export function read_json_file_sync<T = any>(path: string): T | undefined {
    if (fs.existsSync(path)) {
        const json_file = (read_text_file_sync(path) || '').trim()
        if (json_file) {
            try {
                return JSON.parse(json_file)
            } catch (e: any) {
                console.error(e.message)
                return
            }
        }
    }
    return
}

export function camelcase(str: string) {
    return str.split('-').reduce((str, word) => {
        return str + word[0].toUpperCase() + word.slice(1)
    })
}
