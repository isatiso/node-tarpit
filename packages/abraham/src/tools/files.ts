/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { exec } from 'child_process'
import fs from 'fs'

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
                console.log(e.message)
                return
            }
        }
    }
    return
}


