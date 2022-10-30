/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Path, PathValue } from '@tarpit/type-tools'
import fs from 'fs'
import path from 'path'
import { read_json_file_sync } from '../__tools__'
import { CliOptions } from '../cli.type'

const config_file_name = 'tarpit-cli.json'

function load_config_file(config_file?: string): CliOptions {
    if (config_file) {
        return read_json_file_sync(config_file) ?? {}
    }
    let dir = process.cwd()
    while (true) {
        if (dir === '/' || fs.existsSync(path.join(dir, './package.json'))) {
            break
        } else {
            dir = path.dirname(dir)
        }
    }
    if (dir !== '/' && fs.existsSync(path.join(dir, config_file_name))) {
        return read_json_file_sync(path.join(dir, config_file_name)) ?? {}
    }
    return {}
}

function get_value(path: string, data: any) {
    const paths = path.split('.')
    for (const p of paths) {
        data = data?.[p]
        if (data === undefined) {
            break
        }
    }
    return data
}

export class ConfigLoader {

    static readonly _default_options: CliOptions = {}
    private _cache: { [K in Path<CliOptions>]?: PathValue<CliOptions, K> } = {}

    constructor(
        private file_options?: CliOptions,
        private cli_options?: CliOptions,
    ) {
    }

    static load(cli_options: CliOptions, path?: string): ConfigLoader {
        return new ConfigLoader(load_config_file(path), cli_options)
    }

    get<P extends Path<CliOptions>>(path: P): Exclude<PathValue<CliOptions, P>, undefined> {
        if (this._cache[path] === undefined) {
            this._cache[path] = get_value(path, this.cli_options)
                ?? get_value(path, this.file_options)
                ?? get_value(path, ConfigLoader._default_options)
        }
        return this._cache[path] as any
    }
}
