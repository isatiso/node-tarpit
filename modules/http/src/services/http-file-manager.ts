/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpConfigData, TpService } from '@tarpit/core'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import stream from 'node:stream'
import * as tar from 'tar'
import { FileDesc, FileType } from '../__types__'
import { FileLocker } from '../tools/file-locker'

async function too_big(dir: string, limit: number): Promise<boolean> {
    if (!limit) {
        return false
    }
    let total = 0
    const stack: string[] = [dir]

    while (stack.length > 0) {
        const current = stack.pop()!
        const stat = await fsp.lstat(current)
        if (stat.isSymbolicLink()) {
            total += stat.size
        } else if (stat.isFile()) {
            total += stat.size
        } else if (stat.isDirectory()) {
            const entries = await fsp.readdir(current)
            for (const entry of entries) {
                stack.push(path.join(current, entry))
            }
        }
        if (total > limit) {
            return true
        }
    }

    return false
}

@TpService()
export class HttpFileManager {

    readonly data_path = this._config.get('http.file_manager.root') || ''
    readonly download_size_limit = this._config.get('http.file_manager.download_limit') || 0

    private _file_locker = new FileLocker()

    constructor(
        private _config: TpConfigData,
    ) {
    }

    /**
     * Creates a zip archive of a directory.
     * @param p Directory to zip.
     * @returns A stream of the zip archive.
     */
    async zip(p: string): Promise<stream.Transform> {
        const filepath = path.join(this.data_path, p)
        if (await too_big(filepath, this.download_size_limit)) {
            throw new Error('Archive size exceeds limit')
        }
        return this._file_locker.with_read_lock([p], async () => {
            const pass_through = new stream.PassThrough()
            tar.c({ z: true, cwd: filepath }, ['.']).pipe(pass_through)
            return pass_through
        })
    }

    /**
     * Reads a file's content.
     * @param p path to the file.
     * @returns File content as a Buffer.
     */
    async read(p: string) {
        const filepath = path.join(this.data_path, p)
        return this._file_locker.with_read_lock([p], () => fsp.readFile(filepath))
    }

    /**
     * Writes content to a file.
     * @param p path to the file.
     * @param content Content to write to the file.
     */
    async write(p: string, content: Buffer) {
        const filepath = path.join(this.data_path, p)
        return this._file_locker.with_write_lock([p], () => fsp.writeFile(filepath, content))
    }

    /**
     * Renames a file.
     * @param pre Previous path to the file.
     * @param cur New path to the file.
     */
    async rename(pre: string, cur: string) {
        const old_filepath = path.join(this.data_path, pre)
        const new_filepath = path.join(this.data_path, cur)
        return this._file_locker.with_write_lock([pre, cur], () => fsp.rename(old_filepath, new_filepath))
    }

    /**
     * Checks if a file or directory exists.
     * @param p path to the file or directory.
     * @returns True if the target exists, false otherwise.
     */
    async exists(p: string) {
        const filepath = path.join(this.data_path, p)
        return await this._file_locker.with_read_lock([p], async () => {
            await fsp.lstat(filepath)
            return true
        }).catch(() => false)
    }

    /**
     * Lists files in a directory.
     * @param p path to the directory.
     * @returns Array of file descriptions.
     */
    async ls(p: string): Promise<FileDesc[]> {
        const filepath = path.join(this.data_path, p)
        return this._file_locker.with_read_lock([p], async () => {
            const files = await fsp.readdir(filepath, { withFileTypes: true })
            return Promise.all(files.map(async f => ({
                name: f.name,
                type: this.extract_type(f),
                ...(await fsp.lstat(path.join(filepath, f.name)))
            })))
        })
    }

    /**
     * Removes a file or directory.
     * @param p path to the file or directory.
     */
    async rm(p: string) {
        const filepath = path.join(this.data_path, p)
        return this._file_locker.with_write_lock([p], () => fsp.rm(filepath, { recursive: true, force: true }))
    }

    /**
     * Creates a directory.
     * @param p Directory to create.
     */
    async mkdir(p: string) {
        const filepath = path.join(this.data_path, p)
        return this._file_locker.with_write_lock([p], () => fsp.mkdir(filepath, { recursive: true }))
    }

    /**
     * Extracts the type of file or directory.
     * @param d Directory entry to analyze.
     * @returns The file type.
     */
    private extract_type(d: fs.Dirent): FileType {
        if (d.isFile()) {
            return 'file'
        }
        if (d.isDirectory()) {
            return 'directory'
        }
        if (d.isBlockDevice()) {
            return 'block'
        }
        if (d.isCharacterDevice()) {
            return 'character'
        }
        if (d.isSymbolicLink()) {
            return 'link'
        }
        if (d.isFIFO()) {
            return 'fifo'
        }
        if (d.isSocket()) {
            return 'socket'
        }
        return 'unknown'
    }
}
