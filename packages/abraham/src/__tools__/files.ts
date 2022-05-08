import { exec } from 'child_process'
import fs from 'fs'
import process from 'process'

export async function command_exists(cmd: string) {
    cmd = cmd.trim()
    return new Promise<boolean>((resolve) => {
        const child = exec(`hash ${cmd} 2>/dev/null`)
        child.on('exit', () => {
            child.exitCode ? resolve(false) : resolve(true)
        })
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
        process.stdout.write('tcli> ' + cmd_line + '\n')
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


