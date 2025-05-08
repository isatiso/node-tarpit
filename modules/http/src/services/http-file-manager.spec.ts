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
    const test_dir = './test/file_manager_test'
    const test_file = 'test_file.txt'
    const test_content = 'Hello, World!'

    beforeEach(async function() {
        // Create test directory and file
        await fsp.mkdir(test_dir, { recursive: true })
        await fsp.writeFile(path.join(test_dir, test_file), test_content)
        await fsp.symlink('./test_file.txt', path.join(test_dir, 'link_to_test_file.txt'))

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
    })

    describe('.zip()', function() {
        it('should create a zip archive of a directory', async function() {
            const stream_result = await file_manager.zip('')
            expect(stream_result).to.be.instanceof(stream.Transform)
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
            // Create a socket file for testing (only on Unix-like systems)
            const socket_path = path.join(test_dir, 'test.sock')
            server = net.createServer()
            server.listen(socket_path)

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

            server.close()
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
})
