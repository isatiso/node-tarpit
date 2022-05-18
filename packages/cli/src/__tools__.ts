import { ChildProcess, exec } from 'child_process'
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
    const output: string[] = []
    const err_msg: string[] = []

    function make_error(code: number) {
        error.message = `script returned exit code ${code}\n\n` + err_msg.join('') + '\n\n'
        return error
    }

    return new Promise<string>((resolve, reject) => {
        cmd_line = cmd_line.trim()
        process.stdout.write('tp> ' + cmd_line + '\n')
        const child = exec(cmd_line)
        child.stdout?.on('data', data => {
            output.push(data)
            if (!options?.no_stdout) {
                process.stdout.write(data)
            }
        })
        child.stderr?.on('data', data => {
            err_msg.push(data)
            if (!options?.no_stderr) {
                process.stderr.write(data)
            }
        })
        child.on('exit', () => {
            child.exitCode ? reject(make_error(child.exitCode)) : resolve(output.join(''))
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
                console.log(e.message)
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
