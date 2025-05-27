/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpConfigData } from '@tarpit/core'
import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import chai_spies from 'chai-spies'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import net from 'node:net'
import path from 'node:path'
import stream from 'node:stream'
import { HttpFileManager } from './http-file-manager'

chai.use(cap)
chai.use(chai_spies)

describe('http-file-manager.ts', function() {

    let file_manager: HttpFileManager
    let mock_config: TpConfigData
    let server: net.Server
    const test_dir = path.resolve('./test/file_manager_test')
    const test_file = 'test_file.txt'
    const test_content = 'Hello, World!'

    beforeEach(async function() {
        // Create test directory and file
        await fsp.mkdir(test_dir, { recursive: true })
        await fsp.writeFile(path.join(test_dir, test_file), test_content)
        await fsp.symlink('./test_file.txt', path.join(test_dir, 'link_to_test_file.txt'))

        // Create a socket file for testing (only on Unix-like systems)
        const socket_path = path.join(test_dir, 'test.sock')
        server = net.createServer()
        server.listen(socket_path)
        // Mock configuration
        mock_config = {
            get: (key: string) => {
                if (key === 'http.file_manager.root') {
                    return test_dir
                }
                if (key === 'http.file_manager.download_limit') {
                    return 1024 * 1024 // 1MB
                }
                return
            }
        } as TpConfigData

        file_manager = new HttpFileManager(mock_config)
    })

    afterEach(async function() {
        // Clean up test directory
        await fsp.rm(test_dir, { recursive: true, force: true })
        server.close()
    })

    describe('.zip()', function() {
        it('should create a zip archive of a directory', async function() {
            console.log(fs.readdirSync(test_dir))
            const stream_result = await file_manager.zip('')
            expect(stream_result).to.be.instanceof(stream.Transform)
            stream_result.destroy()
            console.log(fs.readdirSync(test_dir))
        })

        it('should throw error if archive size exceeds limit', async function() {
            // Mock configuration with small size limit
            const small_limit_config = {
                get: (key: string) => {
                    if (key === 'http.file_manager.root') {
                        return test_dir
                    }
                    if (key === 'http.file_manager.download_limit') {
                        return 1
                    } // 1byte
                    return
                }
            } as TpConfigData

            const small_limit_manager = new HttpFileManager(small_limit_config)
            await expect(small_limit_manager.zip('')).to.be.rejectedWith('Archive size exceeds limit')
        })

        it('should not throw error if size limit is 0 (unlimited)', async function() {
            // Mock configuration with no size limit
            const unlimited_config = {
                get: (key: string) => {
                    if (key === 'http.file_manager.root') {
                        return test_dir
                    }
                    if (key === 'http.file_manager.download_limit') {
                        return 0
                    } // 0 means no limit
                    return undefined
                }
            } as TpConfigData

            const unlimited_manager = new HttpFileManager(unlimited_config)
            const stream_result = await unlimited_manager.zip('')
            expect(stream_result).to.be.instanceof(stream.Transform)
        })

        it('should use default path when data_path is empty', async function() {
            // Mock configuration with empty data_path
            const empty_path_config = {
                get: (key: string) => {
                    if (key === 'http.file_manager.root') {
                        return ''
                    }
                    return undefined
                }
            } as TpConfigData

            const spy = chai.spy.on(path, 'resolve', () => test_dir)
            const empty_path_manager = new HttpFileManager(empty_path_config)
            expect(spy).to.have.been.called.with('./data')

            const stream_result = await empty_path_manager.zip('')
            expect(stream_result).to.be.instanceof(stream.Transform)
            chai.spy.restore(path, 'resolve')
        })
    })

    describe('.stat()', function() {
        it('should return stats for a file', async function() {
            const stats = await file_manager.stat(test_file)
            expect(stats).to.be.an('object')
            expect(stats.isFile()).to.be.true
        })

        it('should return stats for a directory', async function() {
            // Create a subdirectory
            await fsp.mkdir(path.join(test_dir, 'subdir'), { recursive: true })
            const stats = await file_manager.stat('subdir')
            expect(stats).to.be.an('object')
            expect(stats.isDirectory()).to.be.true
        })

        it('should reject if target does not exist', async function() {
            await expect(file_manager.stat('nonexistent')).to.be.rejected
        })
    })

    describe('.lstat()', function() {
        it('should return stats for a file without following symlinks', async function() {
            const stats = await file_manager.lstat('link_to_test_file.txt')
            expect(stats).to.be.an('object')
            expect(stats.isSymbolicLink()).to.be.true
        })

        it('should return different results than stat() for symlinks', async function() {
            const lstat_result = await file_manager.lstat('link_to_test_file.txt')
            const stat_result = await file_manager.stat('link_to_test_file.txt')

            expect(lstat_result.isSymbolicLink()).to.be.true
            expect(stat_result.isFile()).to.be.true
        })

        it('should reject if target does not exist', async function() {
            await expect(file_manager.lstat('nonexistent')).to.be.rejected
        })
    })

    describe('.read()', function() {
        it('should read file content', async function() {
            const content = await file_manager.read(test_file)
            expect(content.toString()).to.equal(test_content)
        })

        it('should reject if file does not exist', async function() {
            await expect(file_manager.read('nonexistent.txt')).to.be.rejected
        })
    })

    describe('.write()', function() {
        it('should write content to a file', async function() {
            const new_content = 'New content'
            const new_file = 'new_file.txt'
            await file_manager.write(new_file, Buffer.from(new_content))

            const file_content = await fsp.readFile(path.join(test_dir, new_file), 'utf8')
            expect(file_content).to.equal(new_content)
        })
    })

    describe('.read_stream()', function() {
        it('should create a readable stream for a file', async function() {
            const readable_stream = await file_manager.read_stream(test_file)
            expect(readable_stream).to.be.instanceof(stream.Readable)

            let content = ''
            readable_stream.on('data', (chunk) => {
                content += chunk.toString()
            })

            await new Promise<void>((resolve, reject) => {
                readable_stream.on('end', () => {
                    expect(content).to.equal(test_content)
                    resolve()
                })
                readable_stream.on('error', reject)
            })
        })

        it('should reject if file does not exist', async function() {
            const readable_stream = await file_manager.read_stream('nonexistent.txt')
            
            await new Promise<void>((resolve, reject) => {
                readable_stream.on('error', (error) => {
                    expect(error.message).to.include('ENOENT')
                    resolve()
                })
                readable_stream.on('end', () => {
                    reject(new Error('Expected an error but stream ended successfully'))
                })
            })
        })

        it('should reject paths outside of datapath in .read_stream()', async function() {
            await expect(file_manager.read_stream('../outside.txt')).to.be.rejectedWith('Access outside the data path is not allowed')
        })

        it('should maintain file lock during stream reading', async function() {
            // Create a larger test file to ensure stream takes some time
            const large_file = 'large_test_file.txt'
            const large_content = 'x'.repeat(50000) // 50KB content to ensure longer read time
            await fsp.writeFile(path.join(test_dir, large_file), large_content)

            const events: string[] = []
            
            // Start read stream operation
            const read_promise = (async () => {
                events.push('read_started')
                const readable_stream = await file_manager.read_stream(large_file)
                
                return new Promise<void>((resolve, reject) => {
                    let received_content = ''
                    
                    // Slow down the reading by pausing every chunk
                    readable_stream.on('data', (chunk) => {
                        received_content += chunk.toString()
                        // Pause and resume to slow down the reading process
                        readable_stream.pause()
                        setTimeout(() => {
                            readable_stream.resume()
                        }, 5) // 5ms delay per chunk
                    })
                    
                    readable_stream.on('end', () => {
                        events.push('read_finished')
                        expect(received_content).to.equal(large_content)
                        resolve()
                    })
                    
                    readable_stream.on('error', reject)
                })
            })()

            // Wait for read to definitely start
            await new Promise(resolve => setTimeout(resolve, 100))
            
            // Try to write to the same file while reading
            const write_promise = (async () => {
                events.push('write_started')
                await file_manager.write(large_file, Buffer.from('modified content'))
                events.push('write_finished')
            })()

            // Wait for both operations to complete
            await Promise.all([read_promise, write_promise])

            // Verify the order of events - read should complete before write starts
            expect(events).to.deep.equal(['read_started', 'read_finished', 'write_started', 'write_finished'])

            // Verify the file was eventually modified by the write operation
            const final_content = await fsp.readFile(path.join(test_dir, large_file), 'utf8')
            expect(final_content).to.equal('modified content')
        })
    })

    describe('.write_stream()', function() {
        it('should write content from a readable stream to a file', async function() {
            const new_content = 'Stream content for testing'
            const new_file = 'stream_test_file.txt'
            
            // Create a readable stream from a string
            const readable_stream = new stream.Readable({
                read() {
                    this.push(new_content)
                    this.push(null) // End the stream
                }
            })

            await file_manager.write_stream(new_file, readable_stream)

            const file_content = await fsp.readFile(path.join(test_dir, new_file), 'utf8')
            expect(file_content).to.equal(new_content)
        })

        it('should handle empty streams', async function() {
            const new_file = 'empty_stream_file.txt'
            
            // Create an empty readable stream
            const empty_stream = new stream.Readable({
                read() {
                    this.push(null) // End the stream immediately
                }
            })

            await file_manager.write_stream(new_file, empty_stream)

            const file_content = await fsp.readFile(path.join(test_dir, new_file), 'utf8')
            expect(file_content).to.equal('')
        })

        it('should handle large streams', async function() {
            const new_file = 'large_stream_file.txt'
            const chunk_size = 1024
            const chunk_count = 10
            const expected_size = chunk_size * chunk_count
            
            // Create a stream that produces multiple chunks
            let chunks_sent = 0
            const large_stream = new stream.Readable({
                read() {
                    if (chunks_sent < chunk_count) {
                        this.push(Buffer.alloc(chunk_size, 'a'))
                        chunks_sent++
                    } else {
                        this.push(null)
                    }
                }
            })

            await file_manager.write_stream(new_file, large_stream)

            const stats = await fsp.stat(path.join(test_dir, new_file))
            expect(stats.size).to.equal(expected_size)
        })

        it('should reject paths outside of datapath in .write_stream()', async function() {
            const readable_stream = new stream.Readable({
                read() {
                    this.push('test')
                    this.push(null)
                }
            })

            await expect(file_manager.write_stream('../outside.txt', readable_stream)).to.be.rejectedWith('Access outside the data path is not allowed')
        })

        it('should handle stream errors gracefully', async function() {
            const new_file = 'error_stream_file.txt'
            
            // Create a stream that will emit an error
            const error_stream = new stream.Readable({
                read() {
                    this.push('some data')
                    // Emit an error after some data
                    setImmediate(() => {
                        this.destroy(new Error('Stream error for testing'))
                    })
                }
            })

            await expect(file_manager.write_stream(new_file, error_stream)).to.be.rejected
        })

        it('should maintain file lock during stream writing', async function() {
            const test_file_name = 'write_lock_test_file.txt'
            const large_content = 'y'.repeat(50000) // 50KB content
            
            const events: string[] = []
            
            // Create a slow readable stream to ensure write takes time
            let chunks_sent = 0
            const total_chunks = 100
            const slow_write_stream = new stream.Readable({
                read() {
                    if (chunks_sent < total_chunks) {
                        this.push(large_content.substring(chunks_sent * 500, (chunks_sent + 1) * 500))
                        chunks_sent++
                        // Add delay between chunks to slow down the write process
                        setTimeout(() => {
                            // Continue reading
                        }, 5)
                    } else {
                        this.push(null) // End the stream
                    }
                }
            })

            // Start write stream operation
            const write_promise = (async () => {
                events.push('write_started')
                await file_manager.write_stream(test_file_name, slow_write_stream)
                events.push('write_finished')
            })()

            // Wait for write to definitely start
            await new Promise(resolve => setTimeout(resolve, 100))
            
            // Try to read the same file while writing
            const read_promise = (async () => {
                events.push('read_started')
                const content = await file_manager.read(test_file_name)
                events.push('read_finished')
                return content
            })()

            // Wait for both operations to complete
            await Promise.all([write_promise, read_promise])

            // Verify the order of events - write should complete before read starts
            expect(events).to.deep.equal(['write_started', 'write_finished', 'read_started', 'read_finished'])

            // Verify the file was written correctly
            const final_content = await file_manager.read(test_file_name)
            expect(final_content.toString()).to.equal(large_content)
        })
    })

    describe('.rename()', function() {
        it('should rename a file', async function() {
            const new_name = 'renamed_file.txt'
            await file_manager.rename(test_file, new_name)

            const exists_old = await fsp.stat(path.join(test_dir, test_file)).catch(() => false)
            const exists_new = await fsp.stat(path.join(test_dir, new_name)).catch(() => false)

            expect(exists_old).to.equal(false)
            expect(exists_new).to.not.equal(false)
        })
    })

    describe('.exists()', function() {
        it('should return true if file exists', async function() {
            const exists = await file_manager.exists(test_file)
            expect(exists).to.be.true
        })

        it('should return false if file does not exist', async function() {
            const exists = await file_manager.exists('nonexistent.txt')
            expect(exists).to.be.false
        })
    })

    describe('.ls()', function() {
        it('should list files in a directory', async function() {

            // Create a subdirectory
            await fsp.mkdir(path.join(test_dir, 'subdir'), { recursive: true })

            const files = await file_manager.ls('')
            expect(files).to.be.an('array')
            expect(files.length).to.equal(4)

            const file_entry = files.find(f => f.name === test_file)
            const dir_entry = files.find(f => f.name === 'subdir')

            expect(file_entry).to.exist
            expect(file_entry?.type).to.equal('file')
            expect(dir_entry).to.exist
            expect(dir_entry?.type).to.equal('directory')

        })

        it('should handle broken symbolic links gracefully', async function() {
            const broken_link = 'broken_link.txt'
            await fsp.symlink('./nonexistent.txt', path.join(test_dir, broken_link))

            const files = await file_manager.ls('')
            const link_entry = files.find(f => f.name === broken_link)

            expect(link_entry).to.exist
            expect(link_entry?.type).to.equal('link')
            expect(link_entry?.link).to.equal('./nonexistent.txt')
        })
    })

    describe('.rm()', function() {
        it('should remove a file', async function() {
            await file_manager.rm(test_file)
            const exists = await fsp.stat(path.join(test_dir, test_file)).catch(() => false)
            expect(exists).to.equal(false)
        })

        it('should remove a directory recursively', async function() {
            // Create a subdirectory with files
            const subdir = 'subdir'
            await fsp.mkdir(path.join(test_dir, subdir), { recursive: true })
            await fsp.writeFile(path.join(test_dir, subdir, 'subfile.txt'), 'content')

            await file_manager.rm(subdir)
            const exists = await fsp.stat(path.join(test_dir, subdir)).catch(() => false)
            expect(exists).to.equal(false)
        })
    })

    describe('.mkdir()', function() {
        it('should create a directory', async function() {
            const new_dir = 'new_directory'
            await file_manager.mkdir(new_dir)

            const stats = await fsp.stat(path.join(test_dir, new_dir))
            expect(stats.isDirectory()).to.be.true
        })

        it('should create nested directories recursively', async function() {
            const nested_dir = 'parent/child/grandchild'
            await file_manager.mkdir(nested_dir)

            const stats = await fsp.stat(path.join(test_dir, nested_dir))
            expect(stats.isDirectory()).to.be.true
        })
    })

    describe('.extract_type()', function() {
        it('should correctly identify file types', async function() {
            // Get directory contents
            const entries = await file_manager.ls('')

            // Check regular file
            const file_entry = entries.find(e => e.name === test_file)
            expect(file_entry).to.exist
            expect(file_entry?.type).to.equal('file')

            // Create test directory
            await file_manager.mkdir('types_test_dir')
            const dir_entries = await file_manager.ls('')
            const dir_entry = dir_entries.find(e => e.name === 'types_test_dir')
            expect(dir_entry).to.exist
            expect(dir_entry?.type).to.equal('directory')
        })

        it('should handle special file types gracefully', function() {
            // Use private method to test other types
            const mockDirent = (type: string) => {
                return {
                    name: 'test',
                    isFile: () => type === 'file',
                    isDirectory: () => type === 'directory',
                    isSymbolicLink: () => type === 'link',
                    isBlockDevice: () => type === 'block',
                    isCharacterDevice: () => type === 'character',
                    isFIFO: () => type === 'fifo',
                    isSocket: () => type === 'socket'
                } as fs.Dirent
            }

            // @ts-ignore Accessing private method for testing
            expect(file_manager.extract_type(mockDirent('block'))).to.equal('block')
            // @ts-ignore Accessing private method for testing
            expect(file_manager.extract_type(mockDirent('character'))).to.equal('character')
            // @ts-ignore Accessing private method for testing
            expect(file_manager.extract_type(mockDirent('fifo'))).to.equal('fifo')
            // @ts-ignore Accessing private method for testing
            expect(file_manager.extract_type(mockDirent('socket'))).to.equal('socket')

            // Test unknown type
            // 测试未知类型
            const unknownDirent = {
                name: 'test',
                isFile: () => false,
                isDirectory: () => false,
                isSymbolicLink: () => false,
                isBlockDevice: () => false,
                isCharacterDevice: () => false,
                isFIFO: () => false,
                isSocket: () => false
            } as fs.Dirent

            // @ts-ignore Accessing private method for testing
            expect(file_manager.extract_type(unknownDirent)).to.equal('unknown')
        })
    })

    describe('path boundary checks', function() {

        it('should reject paths outside of datapath in .stat()', async function() {
            await expect(file_manager.stat('../outside.txt')).to.be.rejectedWith('Access outside the data path is not allowed')
        })

        it('should reject paths outside of datapath in .lstat()', async function() {
            await expect(file_manager.lstat('../outside.txt')).to.be.rejectedWith('Access outside the data path is not allowed')
        })

        it('should reject paths outside of datapath in .read()', async function() {
            await expect(file_manager.read('../outside.txt')).to.be.rejectedWith('Access outside the data path is not allowed')
        })

        it('should reject paths outside of datapath in .write()', async function() {
            await expect(file_manager.write('../outside.txt', Buffer.from(''))).to.be.rejectedWith('Access outside the data path is not allowed')
        })

        it('should reject paths outside of datapath in .rename()', async function() {
            await expect(file_manager.rename(test_file, '../outside.txt')).to.be.rejectedWith('Rename operation is not allowed outside the data path')
        })

        it('should return false for paths outside of datapath in .exists()', async function() {
            const result = await file_manager.exists('../outside.txt')
            expect(result).to.be.false
        })

        it('should reject paths outside of datapath in .ls()', async function() {
            await expect(file_manager.ls('../')).to.be.rejectedWith('Access outside the data path is not allowed')
        })

        it('should reject paths outside of datapath in .rm()', async function() {
            await expect(file_manager.rm('../outside.txt')).to.be.rejectedWith('Access outside the data path is not allowed')
        })

        it('should reject paths outside of datapath in .mkdir()', async function() {
            await expect(file_manager.mkdir('../outside_dir')).to.be.rejectedWith('Access outside the data path is not allowed')
        })

        it('should reject paths outside of datapath in .zip()', async function() {
            await expect(file_manager.zip('../')).to.be.rejectedWith('Access outside the data path is not allowed')
        })
    })

    describe('.cp()', function() {
        it('should copy a file to a new location', async function() {
            const target_file = 'copied_file.txt'
            await file_manager.cp(test_file, target_file)

            // Check if the file was copied correctly
            const source_content = await fsp.readFile(path.join(test_dir, test_file), 'utf8')
            const target_content = await fsp.readFile(path.join(test_dir, target_file), 'utf8')
            expect(target_content).to.equal(source_content)
        })

        it('should copy a directory recursively', async function() {
            // Create a subdirectory with files
            const subdir = 'cp_test_dir'
            const subfile = 'subfile.txt'
            await fsp.mkdir(path.join(test_dir, subdir), { recursive: true })
            await fsp.writeFile(path.join(test_dir, subdir, subfile), 'test content')

            // Copy the directory
            const target_dir = 'copied_dir'
            await file_manager.cp(subdir, target_dir)

            // Check if directory and its contents were copied correctly
            const exists = await fsp.stat(path.join(test_dir, target_dir)).catch(() => false)
            expect(exists).to.not.equal(false)

            const subfile_content = await fsp.readFile(path.join(test_dir, target_dir, subfile), 'utf8')
            expect(subfile_content).to.equal('test content')
        })

        it('should copy symbolic links correctly', async function() {
            const target_link = 'copied_link.txt'
            await file_manager.cp('link_to_test_file.txt', target_link)

            // Check if the link was copied correctly (the link itself, not the target)
            const link_target = await fsp.readlink(path.join(test_dir, target_link))
            expect(link_target).to.equal('./test_file.txt')
        })

        it('should reject paths outside of datapath in .cp()', async function() {
            await expect(file_manager.cp(test_file, '../outside.txt')).to.be.rejectedWith('Copy operation is not allowed outside the data path')
        })

        it('should reject if source path is outside of datapath in .cp()', async function() {
            await expect(file_manager.cp('../outside.txt', 'inside.txt')).to.be.rejectedWith('Copy operation is not allowed outside the data path')
        })
    })
})
