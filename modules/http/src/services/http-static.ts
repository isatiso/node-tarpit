/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData } from '@tarpit/config'
import { TpService } from '@tarpit/core'
import fs from 'fs'
import { CacheControl } from '../__types__'
import { TpRequest, TpResponse } from '../builtin'
import { finish, throw_standard_status } from '../errors'
import { FileWatcher, SearchedFile } from '../tools/file-watcher'
import { MIME } from '../tools/mime'

const MAX_AGE_LIMIT = 60 * 60 * 24 * 365 * 1000 // 1 year

function make_cache_control(options: CacheControl): string {
    options.public = options.public ?? true
    options['max-age'] = Math.min(options['max-age'] ?? 0, MAX_AGE_LIMIT)
    return Object.entries(options).map(([key, value]) => {
        if (key === 'max-age') {
            return 'max-age=' + value ?? 0
        } else if (key === 's-maxage') {
            return 's-maxage=' + value ?? 0
        } else if (value) {
            return key
        }
    }).filter(key => key).join(', ')
}

@TpService({ inject_root: true })
export class HttpStatic {

    private _mime = new MIME()
    private root: string = this.config.get('http.static.root')
    private cache_size: number = this.config.get('http.static.cache_size') ?? 100
    private vary = this.config.get('http.static.vary')
    private cache_control = this.config.get('http.static.cache_control')
    private readonly file_watcher?: FileWatcher

    constructor(
        private config: ConfigData,
    ) {
        if (!this.root) {
            return
        }
        const index = this.config.get('http.static.index') ?? ['index.html']
        const extensions = this.config.get('http.static.extensions') ?? ['.html']
        this.file_watcher = new FileWatcher(this.root, index, extensions, { cache_size: this.cache_size })
        const root_stats = fs.statSync(this.root)
        if (!root_stats.isDirectory()) {
            throw new Error(`static file watching error: root_dir "${this.root}" is not a directory.`)
        }
    }

    async serve(req: TpRequest, res: TpResponse, options?: { cache_control?: CacheControl, vary?: string[], path?: string }) {
        const file = options?.path ?? req.path
        if (!file) {
            // TODO: adjust status
            console.log(`nofile options: ${options?.path} request: ${req.path}`)
            throw_standard_status(404)
        }

        const searched_file = await this.file_watcher?.lookup(file)
        if (!searched_file) {
            console.log(`no searched file file: ${file} ${this.file_watcher?.constructor.name}`)
            throw_standard_status(404)
        }

        if (res.res.headersSent) {
            return
        }

        res.status = 200
        this.init_header(searched_file, res)

        const len = searched_file.stats.size

        if (this.is_conditional_get(req)) {
            if (this.is_precondition_failure(req, res)) {
                throw_standard_status(412)
            }

            if (this.is_fresh(req, res)) {
                throw_standard_status(304)
            }
        }

        res.set('Content-Length', len)

        if (req.method === 'HEAD') {
            finish(null)
        }

        finish(fs.createReadStream(searched_file.name))
    }

    private is_conditional_get(req: TpRequest): string | undefined {
        return req.get('If-Match') ||
            req.get('If-Unmodified-Since') ||
            req.get('If-None-Match') ||
            req.get('If-Modified-Since')
    }

    private is_fresh(req: TpRequest, res: TpResponse): boolean {
        const last_modified = res.last_modified
        const etag = res.etag?.replace(/^W\//, '')

        const cache_control = req.get('Cache-Control')
        if (cache_control?.indexOf('no-cache') !== -1) {
            return false
        }

        const if_none_match = req.if_none_match
        if (if_none_match) {
            if (!etag) {
                return false
            } else if (if_none_match === '*') {
                return true
            } else {
                const tokens = if_none_match.split(',').map(token => token.trim().replace(/^W\//, ''))
                return !tokens.includes(etag)
            }
        }

        const if_modified_since = req.if_modified_since
        if (if_modified_since) {
            return !last_modified || last_modified <= if_modified_since
        }

        return false
    }

    private is_precondition_failure(req: TpRequest, res: TpResponse): boolean {

        const last_modified = res.last_modified
        const etag = res.etag?.replace(/^W\//, '')

        const if_match = req.if_match
        if (if_match) {
            if (!etag) {
                return true
            } else if (if_match === '*') {
                return false
            } else {
                const tokens = if_match.split(',').map(token => token.trim().replace(/^W\//, ''))
                return tokens.every(token => token !== etag)
            }
        }

        const if_unmodified_since = req.if_unmodified_since
        if (if_unmodified_since) {
            return !last_modified || last_modified > if_unmodified_since
        }

        return false
    }

    private init_header(file: SearchedFile, res: TpResponse) {

        if (!res.has('Content-Type')) {
            const type = this._mime.lookup(file.name) ?? 'bin'
            const charset = this._mime.lookup_charset(type)
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

        if (this.cache_control && !res.has('Cache-Control')) {
            res.set('Cache-Control', make_cache_control(this.cache_control))
        }

        if (this.vary && !res.has('Vary')) {
            res.set('Vary', Array.isArray(this.vary) ? this.vary.join(', ') : this.vary)
        }
    }
}
