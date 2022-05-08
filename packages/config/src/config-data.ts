/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Path, PathValue, Reference } from '@tarpit/judge'
import fs from 'fs'
import path from 'path'

/**
 * 通过全局声明合并扩展 TpConfigSchema。
 *
 * [[include:builtin/config-data.md]]
 *
 * @category ConfigSchema
 */
export interface TpConfigSchema {

}

/**
 * 内置的全局配置内容查找服务。
 *
 * 通过调用 [[Platform.load_config]] 可以加载配置文件，并将配置内容保存到 "ConfigData" 中。
 *
 * NPM 包 [tp-check](https://www.npmjs.com/package/tp-check) 提供了一种检查位置文件是否符合类型 <TpConfigSchema> 的方法。
 *
 * [[include:builtin/config-data.md]]
 *
 * @category Builtin
 */
export class ConfigData extends Reference<TpConfigSchema> {

    /**
     * @param data 配置文件内容。
     */
    constructor(
        data: TpConfigSchema
    ) {
        super(data)
    }

    /**
     * 返回完整配置对象。
     */
    get<K extends Path<TpConfigSchema>>(): TpConfigSchema
    /**
     * 查找指定路径的配置。
     *
     * @param path JSON 路径。
     */
    get<K extends Path<TpConfigSchema>>(path: K): PathValue<TpConfigSchema, K>
    get<K extends Path<TpConfigSchema>>(path?: K): PathValue<TpConfigSchema, K> | TpConfigSchema {
        if (!path) {
            return super.get()
        }
        return super.get(path)!
    }
}

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
        if (!fs.existsSync(path.resolve('config/default.json'))) {
            throw new Error('No specified configuration file, and "config/default.json" not exist.')
        }
        return new ConfigData(try_read_json('config/default.json'))
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
