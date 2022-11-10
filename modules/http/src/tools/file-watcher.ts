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

    private cache = new cache<string, SearchedFile>({ max: this.options?.cache_size ?? 100 })
    private watcher = fs.watch(this.root, { recursive: true })

    constructor(
        private root: string,
        private index: string[],
        private extensions: `.${string}`[],
        private options: { cache_size?: number },
    ) {
        this.watcher.on('change', (eventType, filename: string) => {
            const file = path.join(this.root, filename)
            for (const [key, value] of this.cache.entries()) {
                if (value.name === file) {
                    this.cache.delete(key)
                }
            }
        })
    }

    close() {
        this.watcher.close()
    }

    async lookup(filepath: string): Promise<SearchedFile | undefined> {
        const cache = this.cache.get(filepath)
        if (cache) {
            return cache
        }

        const full_path = path.join(this.root, filepath.replace(/^\//, ''))
        const abs_path = path.resolve(full_path)
        const relative_path = path.relative(this.root, abs_path)
        console.log(`full_path: ${full_path}, abs_path: ${abs_path}, relative_path: ${relative_path}`)
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

        console.log('alt_list', alt_list)

        for (const name of alt_list) {
            const stats = await fs.promises.stat(name).catch(() => undefined)
            if (stats) {
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
