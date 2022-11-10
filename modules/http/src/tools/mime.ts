/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import fs from 'fs'
import types from './types.json'

export class MIME {

    private types: Record<string, string> = {}
    private extensions: Record<string, string> = {}
    private readonly default_type: string

    constructor() {
        this.define(types)
        this.default_type = this.lookup('bin')
    }

    define(entries: Record<string, string[]> | (readonly [string, string[]])[]) {
        if (!Array.isArray(entries)) {
            entries = Object.entries(entries)
        }
        for (const [type, extensions] of entries) {
            for (const ext of extensions) {
                this.types[ext] = type
            }
            if (!this.extensions[type]) {
                this.extensions[type] = extensions[0]
            }
        }
    }

    load(filepath: string) {
        this.define(fs.readFileSync(filepath, 'ascii')
            .split(/[\r\n]+/)
            .map(line => line.replace(/\s*#.*|^\s*|\s*$/g, '').split(/\s+/))
            .map(fields => [fields[0], fields.slice(1)] as const))
    }

    lookup(path: string, fallback?: string) {
        const ext = path.replace(/^.*[.\/\\]/, '').toLowerCase()
        return this.types[ext] || fallback || this.default_type
    }

    lookup_charset(mime_type: string, fallback?: string) {
        return (/^text\/|^application\/(javascript|json)/).test(mime_type) ? 'UTF-8' : fallback
    }

    extension(mime_type: string) {
        const type = mime_type.match(/^\s*([^;\s]*)(?:;|\s|$)/)?.[1].toLowerCase() ?? ''
        return this.extensions[type]
    }
}
