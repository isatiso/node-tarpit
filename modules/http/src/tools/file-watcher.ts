/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import fs from 'fs'
import cache from 'lru-cache'
import path from 'path'

export interface SearchedFile {
    stats: fs.Stats
    name: string
    is_dot: boolean
}

export class FileWatcher {

    private cache = new cache<string, SearchedFile>({ max: this.options.cache_size ?? 100 })

    constructor(
        private root: string,
        private index: string[],
        private extensions: `.${string}`[],
        private options: { cache_size?: number },
    ) {
    }

    async lookup(filepath: string): Promise<SearchedFile | undefined> {
        const cache = this.cache.get(filepath)
        if (cache) {
            const stats = await fs.promises.stat(cache.name).catch(() => undefined)
            if (stats?.isFile()) {
                cache.stats = stats
                return cache
            } else {
                this.cache.delete(filepath)
            }
        }

        const full_path = path.join(this.root, filepath.replace(/^\//, ''))
        const abs_path = path.resolve(full_path)
        const relative_path = path.relative(this.root, abs_path)
        if (relative_path.startsWith('..')) {
            return
        }

        const is_dot = this.contains_dot_file(relative_path)

        const alt_list: string[] = []
        if (this.has_trailing_slash(filepath)) {
            this.index.forEach(name => alt_list.push(path.join(abs_path, name)))
        } else if (this.has_extension(filepath)) {
            alt_list.push(abs_path)
        } else {
            alt_list.push(abs_path)
            this.extensions.forEach(ext => alt_list.push(abs_path + ext))
        }

        for (const name of alt_list) {
            const stats = await fs.promises.stat(name).catch(() => undefined)
            if (stats?.isFile()) {
                const result = { name, stats, is_dot }
                this.cache.set(filepath, result)
                return result
            }
        }
    }

    private contains_dot_file(filename: string) {
        return !!filename.split('/').find(part => part.startsWith('.'))
    }

    private has_extension(filepath: string) {
        const slash_index = Math.max(filepath.lastIndexOf('/'), 0)
        return filepath.slice(slash_index).indexOf('.') > 0
    }

    private has_trailing_slash(filepath: string) {
        return filepath.slice(-1) === '/'
    }
}
