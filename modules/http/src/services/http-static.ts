/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpConfigData, TpService } from '@tarpit/core'
import fs, { ReadStream } from 'fs'
import mime_types from 'mime-types'
import { TpRequest, TpResponse } from '../builtin'
import { throw_forbidden, throw_not_found, throw_not_modified, throw_precondition_failed, TpHttpFinish } from '../errors'
import { HttpStaticConfig } from '../index'
import { ResponseCacheControl } from '../tools/cache-control'
import { FileWatcher, SearchedFile } from '../tools/file-watcher'

const MAX_AGE_LIMIT = 60 * 60 * 24 * 365 * 1000 // 1 year

export function is_precondition_failure(request: TpRequest, response: TpResponse): boolean {

    const if_match = request.if_match
    if (if_match) {
        const etag = response.etag?.replace(/^W\//, '')
        if (!etag) {
            return true
        } else if (if_match === '*') {
            return false
        } else {
            const tokens = if_match.split(',').map(token => token.trim().replace(/^W\//, ''))
            return tokens.every(token => token !== etag)
        }
    }

    const if_unmodified_since = request.if_unmodified_since
    if (if_unmodified_since !== undefined) {
        const last_modified = response.last_modified
        return last_modified ? last_modified > if_unmodified_since : true
    }

    return false
}

export function is_fresh(request: TpRequest, res: TpResponse): boolean {

    if (request.cache_control?.['no-cache']) {
        return false
    }

    const if_none_match = request.if_none_match
    if (if_none_match) {
        const etag = res.etag?.replace(/^W\//, '')
        if (!etag) {
            return false
        } else if (if_none_match === '*') {
            return true
        } else {
            const tokens = if_none_match.split(',').map(token => token.trim().replace(/^W\//, ''))
            return tokens.includes(etag)
        }
    }

    const if_modified_since = request.if_modified_since
    if (if_modified_since !== undefined) {
        const last_modified = res.last_modified
        return last_modified ? last_modified <= if_modified_since : false
    }

    return false
}

export async function create_stream(filename: string): Promise<ReadStream> {
    const error = new TpHttpFinish({ status: 404, code: '404', msg: 'Not Found' })
    return new Promise((resolve, reject) => {
        const stream = fs.createReadStream(filename)
        stream.on('ready', () => resolve(stream))
        stream.on('error', () => reject(error))
    })
}

export interface ServeStaticOptions {
    scope?: string
    dotfile?: 'allow' | 'ignore' | 'deny'
    cache_control?: ResponseCacheControl
    vary?: string[] | '*'
    path?: string
}

@TpService({ inject_root: true })
export class HttpStatic {

    private readonly static_configs: Record<string, HttpStaticConfig> = {}
    private readonly file_watchers: Record<string, FileWatcher> = {}

    constructor(
        private config: TpConfigData,
    ) {
        const static_config_data = this.config.get('http.static') ?? []
        const static_config_list = Array.isArray(static_config_data) ? static_config_data : [static_config_data]
        if (static_config_list.length === 0) {
            static_config_list.push({})
        }
        for (const c of static_config_list) {
            c.root = c.root ?? process.cwd()
            c.cache_size = c.cache_size ?? 100
            c.dotfile = c.dotfile ?? 'ignore'
            c.scope = c.scope ?? ''
            c.index = c.index ?? ['index.html']
            c.extensions = c.extensions ?? ['.html']
            const root_stats = fs.statSync(c.root)
            if (!root_stats.isDirectory()) {
                throw new Error(`static file watching error: root_dir "${c.root}" is not a directory.`)
            }
            this.static_configs[c.scope] = c
            this.file_watchers[c.scope] = new FileWatcher(c.root, c.index, c.extensions, { cache_size: c.cache_size })
        }
    }

    async serve(request: TpRequest, response: TpResponse, options?: ServeStaticOptions) {

        const file = options?.path ?? request.path ?? '/'
        const scope = options?.scope ?? ''
        if (!this.static_configs[scope] || !this.file_watchers[scope]) {
            throw_not_found()
        }

        const cfg = this.static_configs[scope]
        const decoded_file = decodeURI(file)

        const searched_file = await this.file_watchers[scope].lookup(decoded_file)
        if (!searched_file) {
            throw_not_found()
        }

        if (searched_file.is_dot) {
            const dotfile = options?.dotfile ?? cfg.dotfile
            if (dotfile === 'deny') {
                throw_forbidden()
            } else if (dotfile === 'ignore') {
                throw_not_found()
            }
        }

        response.status = 200

        this.init_header(searched_file, scope, response, { ...options })

        if (is_precondition_failure(request, response)) {
            throw_precondition_failed()
        }

        if (is_fresh(request, response)) {
            throw_not_modified()
        }

        response.length = searched_file.stats.size
        return create_stream(searched_file.name)
    }

    private init_header(file: SearchedFile, scope: string, res: TpResponse, options: Pick<ServeStaticOptions, 'vary' | 'cache_control'>) {

        const vary = options.vary ?? this.static_configs[scope].vary
        const cache_control = options.cache_control ?? this.static_configs[scope].cache_control ?? { public: true, 'max-age': 0 }

        if (!res.has('Content-Type')) {
            const type = mime_types.lookup(file.name) || ''
            const charset = mime_types.charset(type) || ''
            res.set('Content-Type', type + (charset ? '; charset=' + charset : ''))
        }

        if (!res.has('Last-Modified')) {
            res.set('Last-Modified', file.stats.mtime.toUTCString())
        }

        if (!res.has('ETag')) {
            const mtime = file.stats.mtime.getTime().toString(16)
            const size = file.stats.size.toString(16)
            res.set('ETag', '"' + size + '-' + mtime + '"')
        }

        if (cache_control && !res.has('Cache-Control')) {
            cache_control['max-age'] = cache_control['max-age'] ? Math.min(cache_control['max-age'], MAX_AGE_LIMIT) : 0
            res.cache_control = cache_control
        }

        if (vary && !res.has('Vary')) {
            res.set('Vary', Array.isArray(vary) ? vary.join(',') : vary)
        }
    }
}
