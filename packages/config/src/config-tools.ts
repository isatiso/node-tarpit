/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import fs from 'fs'
import path from 'path'
import { ConfigData, TpConfigSchema } from './config-data'

function read_json(file: string) {
    const res: TpConfigSchema = JSON.parse(fs.readFileSync(path.resolve(file)).toString('utf-8'))
    if (!res) {
        throw new Error('Specified configuration file is empty.')
    }
    return res
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
        return new ConfigData(read_json('tarpit.json'))
    } else if (typeof data === 'string') {
        if (!fs.existsSync(path.resolve(path.resolve(data)))) {
            throw new Error(`Specified configuration file "${data}" not exists.`)
        }
        return new ConfigData(read_json(data))
    } else if (typeof data === 'function') {
        return new ConfigData(data())
    } else {
        return new ConfigData(data)
    }
}
