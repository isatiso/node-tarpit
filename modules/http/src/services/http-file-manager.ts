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
import stream, { pipeline } from 'node:stream'
import { promisify } from 'node:util'
import * as tar from 'tar'
import { FileDesc, FileType } from '../__types__'
import { FileLocker } from '../tools/file-locker'

const pipelineAsync = promisify(pipeline)

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

/**
 * Manages file operations such as reading, writing, copying, and archiving within a restricted data path.
 */
@TpService()
export class HttpFileManager {

    readonly data_path = this._config.get('http.file_manager.root') || path.resolve('./data')
    readonly download_size_limit = this._config.get('http.file_manager.download_limit') || 0

    private _file_locker = new FileLocker()

    constructor(
        private _config: TpConfigData,
    ) {
        fs.mkdirSync(this.data_path, { recursive: true })
    }

    /**
     * Creates a tar.gz archive of a directory.
     * @param p Directory to archive.
     * @returns A stream of the tar.gz archive.
     */
    async zip(p: string): Promise<stream.Transform> {
        const filepath = path.join(this.data_path, p)
        if (!filepath.startsWith(this.data_path)) {
            throw new Error('Access outside the data path is not allowed')
        }
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
     * Reads the content of a file.
     * @param p Path to the file.
     * @returns A promise that resolves to the file's content as a Buffer.
     */
    async read(p: string): Promise<Buffer> {
        const filepath = path.join(this.data_path, p)
        if (!filepath.startsWith(this.data_path)) {
            throw new Error('Access outside the data path is not allowed')
        }
        return this._file_locker.with_read_lock([p], () => fsp.readFile(filepath))
    }

    /**
     * Creates a readable stream for a file.
     * @param p Path to the file.
     * @returns A readable stream of the file's content.
     */
    async read_stream(p: string): Promise<stream.Readable> {
        const filepath = path.join(this.data_path, p)
        if (!filepath.startsWith(this.data_path)) {
            throw new Error('Access outside the data path is not allowed')
        }
        
        const pass_through = new stream.PassThrough()
        
        // Acquire the lock and keep it until the stream is finished
        this._file_locker.with_read_lock([p], async () => {
            const read_stream = fs.createReadStream(filepath)
            await pipelineAsync(read_stream, pass_through)
        }).catch((error) => {
            pass_through.destroy(error)
        })
        
        return pass_through
    }

    /**
     * Writes content to a file.
     * @param p Path to the file.
     * @param content Content to write to the file.
     * @returns A promise that resolves when the file has been successfully written.
     */
    async write(p: string, content: Buffer): Promise<void> {
        const filepath = path.join(this.data_path, p)
        if (!filepath.startsWith(this.data_path)) {
            throw new Error('Access outside the data path is not allowed')
        }
        return this._file_locker.with_write_lock([p], () => fsp.writeFile(filepath, content))
    }

    /**
     * Writes content from a readable stream to a file.
     * @param p Path to the file.
     * @param input_stream Readable stream containing the content to write.
     * @returns A promise that resolves when the file has been successfully written.
     */
    async write_stream(p: string, input_stream: stream.Readable): Promise<void> {
        const filepath = path.join(this.data_path, p)
        if (!filepath.startsWith(this.data_path)) {
            throw new Error('Access outside the data path is not allowed')
        }
        return this._file_locker.with_write_lock([p], async () => {
            const write_stream = fs.createWriteStream(filepath)
            await pipelineAsync(input_stream, write_stream)
        })
    }

    /**
     * Renames a file, directory, or symbolic link.
     * @param pre Previous path to the file, directory, or symbolic link.
     * @param cur New path for the file, directory, or symbolic link.
     */
    async rename(pre: string, cur: string): Promise<void> {
        const old_filepath = path.join(this.data_path, pre)
        const new_filepath = path.join(this.data_path, cur)
        if (!new_filepath.startsWith(this.data_path) || !old_filepath.startsWith(this.data_path)) {
            throw new Error('Rename operation is not allowed outside the data path')
        }
        return this._file_locker.with_write_lock([pre, cur], () => fsp.rename(old_filepath, new_filepath))
    }

    /**
     * Copies a file, directory, or symbolic link from the source path to the destination path.
     * If the source is a symbolic link, the symbolic link itself is copied rather than the target it references.
     * For files and directories, the content is recursively copied to the destination while preserving symbolic links.
     *
     * @param pre Source path of the file, directory, or symbolic link.
     * @param cur Destination path for the file, directory, or symbolic link.
     */
    async cp(pre: string, cur: string): Promise<void> {
        const old_filepath = path.join(this.data_path, pre)
        const new_filepath = path.join(this.data_path, cur)
        if (!new_filepath.startsWith(this.data_path) || !old_filepath.startsWith(this.data_path)) {
            throw new Error('Copy operation is not allowed outside the data path')
        }
        return this._file_locker.with_write_lock([pre, cur], async () => {
            const stat = await fsp.lstat(old_filepath)
            if (stat.isSymbolicLink()) {
                const link = await fsp.readlink(old_filepath)
                await fsp.symlink(link, new_filepath)
            } else {
                await fsp.cp(old_filepath, new_filepath, { verbatimSymlinks: true, recursive: true })
            }
        })
    }

    /**
     * Checks if a file or directory exists.
     * @param p Path to the file or directory.
     * @returns True if the file or directory exists, false otherwise.
     */
    async exists(p: string): Promise<boolean> {
        const filepath = path.join(this.data_path, p)
        if (!filepath.startsWith(this.data_path)) {
            return false
        }
        return await this._file_locker.with_read_lock([p], async () => {
            await fsp.lstat(filepath)
            return true
        }).catch(() => false)
    }

    /**
     * Lists files and directories in the specified directory.
     * @param p Path to the directory.
     * @returns An array of file and directory descriptions, including their type, name, size, modification time, creation time, and symbolic link target (if applicable).
     */
    async ls(p: string): Promise<FileDesc[]> {
        const filepath = path.join(this.data_path, p)
        if (!filepath.startsWith(this.data_path)) {
            throw new Error('Access outside the data path is not allowed')
        }
        return this._file_locker.with_read_lock([p], async () => {
            return fsp.readdir(filepath, { withFileTypes: true })
                .then(files => Promise.all(files.map(async f => {
                    const target = path.join(filepath, f.name)
                    const stats = await fsp.stat(target).catch(() => fsp.lstat(target))
                    return {
                        name: f.name,
                        type: this.extract_type(stats),
                        link: f.isSymbolicLink() ? await fsp.readlink(target) : undefined,
                        ...stats,
                    }
                })))
        })
    }

    /**
     * Retrieves stat information of a file or directory, following symbolic links.
     * @param p Path to the file or directory.
     * @returns A Promise that resolves to a Stats object containing file or directory information.
     */
    async stat(p: string): Promise<fs.Stats> {
        const filepath = path.join(this.data_path, p)
        if (!filepath.startsWith(this.data_path)) {
            throw new Error('Access outside the data path is not allowed')
        }
        return this._file_locker.with_read_lock([p], () => fsp.stat(filepath))
    }

    /**
     * Retrieves lstat information of a file or directory without following symbolic links.
     * @param p Path to the file or directory.
     * @returns A Promise that resolves to a Stats object containing file or directory information.
     */
    async lstat(p: string): Promise<fs.Stats> {
        const filepath = path.join(this.data_path, p)
        if (!filepath.startsWith(this.data_path)) {
            throw new Error('Access outside the data path is not allowed')
        }
        return this._file_locker.with_read_lock([p], () => fsp.lstat(filepath))
    }

    /**
     * Removes a file or directory. The operation is restricted to paths within the data path.
     * @param p Path to the file or directory to be removed.
     */
    async rm(p: string): Promise<void> {
        const filepath = path.join(this.data_path, p)
        if (!filepath.startsWith(this.data_path)) {
            throw new Error('Access outside the data path is not allowed')
        }
        return this._file_locker.with_write_lock([p], () => fsp.rm(filepath, { recursive: true, force: true }))
    }

    /**
     * Creates a directory at the specified path. The operation is restricted to paths within the data path.
     * @param p Path of the directory to create.
     */
    async mkdir(p: string): Promise<string | undefined> {
        const filepath = path.join(this.data_path, p)
        if (!filepath.startsWith(this.data_path)) {
            throw new Error('Access outside the data path is not allowed')
        }
        return this._file_locker.with_write_lock([p], () => fsp.mkdir(filepath, { recursive: true }))
    }

    /**
     * Extracts the type of file or directory based on the provided stats or directory entry.
     * @param d Stats or directory entry to analyze.
     * @returns The determined file type as a `FileType`.
     */
    private extract_type(d: fs.Dirent | fs.Stats): FileType {
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
