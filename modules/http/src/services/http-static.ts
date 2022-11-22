/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData } from '@tarpit/config'
import { OnTerminate, TpService } from '@tarpit/core'
import fs from 'fs'
import mime_types from 'mime-types'
import { TpRequest, TpResponse } from '../builtin'
import { finish, throw_forbidden, throw_not_found, throw_not_modified, throw_precondition_failed } from '../errors'
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

export interface ServeStaticOptions {
    dotfile?: 'allow' | 'ignore' | 'deny'
    cache_control?: ResponseCacheControl
    vary?: string[] | '*'
    path?: string
}

@TpService({ inject_root: true })
export class HttpStatic {

    // private _mime = new MIME()
    private root: string = this.config.get('http.static.root') ?? process.cwd()
    private cache_size: number = this.config.get('http.static.cache_size') ?? 100
    private dotfile = this.config.get('http.static.dotfile') ?? 'ignore'
    private vary = this.config.get('http.static.vary')
    private cache_control = this.config.get('http.static.cache_control')
    private readonly file_watcher: FileWatcher

    constructor(
        private config: ConfigData,
    ) {
        const index = this.config.get('http.static.index') ?? ['index.html']
        const extensions = this.config.get('http.static.extensions') ?? ['.html']
        const root_stats = fs.statSync(this.root)
        if (!root_stats.isDirectory()) {
            throw new Error(`static file watching error: root_dir "${this.root}" is not a directory.`)
        }
        this.file_watcher = new FileWatcher(this.root, index, extensions, { cache_size: this.cache_size })
    }

    async serve(request: TpRequest, response: TpResponse, options?: ServeStaticOptions) {

        const file = options?.path ?? request.path ?? '/'

        const decoded_file = decodeURI(file)
        const searched_file = await this.file_watcher.lookup(decoded_file)
        if (!searched_file) {
            throw_not_found()
        }

        if (searched_file.is_dot) {
            const dotfile = options?.dotfile ?? this.dotfile
            if (dotfile === 'deny') {
                throw_forbidden()
            } else if (dotfile === 'ignore') {
                throw_not_found()
            }
        }

        response.status = 200

        this.init_header(searched_file, response, { ...options })

        if (is_precondition_failure(request, response)) {
            throw_precondition_failed()
        }

        if (is_fresh(request, response)) {
            throw_not_modified()
        }

        response.length = searched_file.stats.size
        finish(fs.createReadStream(searched_file.name))
    }

    private init_header(file: SearchedFile, res: TpResponse, options: Pick<ServeStaticOptions, 'vary' | 'cache_control'>) {

        const vary = options.vary ?? this.vary
        const cache_control = options.cache_control ?? this.cache_control ?? { public: true, 'max-age': 0 }

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

    @OnTerminate()
    private async on_terminate() {
        return this.file_watcher.close()
    }
}
