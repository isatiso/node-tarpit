/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { FileLocker } from './file-locker'

chai.use(cap)

describe('file-locker.ts', function() {

    describe('FileLocker', function() {

        let file_locker: FileLocker

        beforeEach(function() {
            file_locker = new FileLocker()
        })

        describe('#with_read_lock()', function() {

            it('should allow multiple read locks simultaneously', async function() {
                const lock1 = file_locker.with_read_lock(['dir/file1'], async () => 'read1')
                const lock2 = file_locker.with_read_lock(['dir/file1'], async () => 'read2')
                await expect(lock1).to.eventually.equal('read1')
                await expect(lock2).to.eventually.equal('read2')
            })

            it('should block write locks while read locks are active', async function() {
                let write_completed = false
                const read_lock = file_locker.with_read_lock(['file1'], async () => {
                    await new Promise(resolve => setTimeout(resolve, 50))
                })
                await new Promise(resolve => setTimeout(resolve, 10))
                const write_lock = file_locker.with_write_lock(['file1'], async () => {
                    write_completed = true
                })
                await read_lock
                await write_lock
                expect(write_completed).to.be.true
            })
        })

        describe('#with_write_lock()', function() {

            it('should allow a single write lock at a time', async function() {
                let write_completed = false
                const write_lock1 = file_locker.with_write_lock(['file1'], async () => {
                    await new Promise(resolve => setTimeout(resolve, 50))
                    write_completed = true
                })
                const write_lock2 = file_locker.with_write_lock(['file1'], async () => 'write2')
                await write_lock1
                await expect(write_lock2).to.eventually.equal('write2')
                expect(write_completed).to.be.true
            })

            it('should block read locks while a write lock is active', async function() {
                let read_completed = false
                const write_lock = file_locker.with_write_lock(['file1'], async () => {
                    await new Promise(resolve => setTimeout(resolve, 50))
                })
                await new Promise(resolve => setTimeout(resolve, 10))
                const read_lock = file_locker.with_read_lock(['file1'], async () => {
                    read_completed = true
                })
                await write_lock
                await read_lock
                expect(read_completed).to.be.true
            })
        })

        describe('lock ordering', function() {

            it('should handle multiple locks on different files independently', async function() {
                const lock1 = file_locker.with_read_lock(['file1'], async () => 'read1')
                const lock2 = file_locker.with_write_lock(['file2'], async () => 'write2')
                await expect(lock1).to.eventually.equal('read1')
                await expect(lock2).to.eventually.equal('write2')
            })
        })
    })
})
