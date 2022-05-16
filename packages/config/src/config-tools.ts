/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from 'fs'
import path from 'path'
import { ConfigData, TpConfigSchema } from './config-data'

function try_read_json(file: string) {
    try {
        const res = JSON.parse(fs.readFileSync(path.resolve(file)).toString('utf-8'))
        if (!res) {
            console.error('Specified configuration file is empty.')
            process.exit(1)
        }
        return res
    } catch (e: any) {
        console.error(`Parse configuration file failed.`)
        console.error(`    File: ${path.resolve(file)}`)
        console.error(`    Error: ${e.message}`)
        process.exit(1)
    }
}

/**
 * 加载配置文件，读文件方式。
 */
export function load_config(): ConfigData
/**
 * 加载配置文件，读文件方式。
 * @param file_path
 */
export function load_config(file_path: string | undefined): ConfigData
/**
 * 加载配置文件，JSON 对象方式。
 * @param data
 */
export function load_config(data: TpConfigSchema): ConfigData
/**
 * 加载配置文件，函数方式。
 * @param data
 */
export function load_config(data: () => TpConfigSchema): ConfigData
export function load_config(data?: string | TpConfigSchema | (() => TpConfigSchema)): ConfigData
export function load_config(data?: string | TpConfigSchema | (() => TpConfigSchema)): ConfigData {
    if (!data) {
        if (!fs.existsSync(path.resolve('tarpit.json'))) {
            throw new Error('No specified configuration file, and "tarpit.json" not exist.')
        }
        return new ConfigData(try_read_json('tarpit.json'))
    } else if (typeof data === 'string') {
        if (!fs.existsSync(path.resolve(path.resolve(data)))) {
            throw new Error(`Specified configuration file "${data}" not exists.`)
        }
        return new ConfigData(try_read_json(data))
    } else if (typeof data === 'function') {
        return new ConfigData(data())
    } else {
        return new ConfigData(data)
    }
}
