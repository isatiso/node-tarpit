/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import chai_spies from 'chai-spies'
import fs from 'fs'
import { FileWatcher } from './file-watcher'

chai.use(cap)
chai.use(chai_spies)

describe('file-watcher.ts', function() {

    describe('.lookup()', function() {

        let cleanup: (() => void)[] = []

        afterEach(async function() {
            cleanup.forEach(func => func())
            cleanup = []
        })

        it('should lookup file by specified name', async function() {
            const watcher = new FileWatcher('./test/assets', [], [], { cache_size: 100 })
            cleanup.push(() => watcher.close())
            const file = await watcher.lookup('some.txt')
            expect(file).to.have.property('name').which.is.satisfy((name: string) => name.endsWith('assets/some.txt'))
            expect(file).to.have.property('is_dot').which.equals(false)
        })

        it('should remove cache on file change', async function() {
            const watcher = new FileWatcher('./test/assets', [], [], {})
            cleanup.push(() => watcher.close())
            fs.writeFileSync('./test/assets/temp.txt', 'some random text')
            await watcher.lookup('some.txt')
            expect(await watcher.lookup('temp.txt')).to.exist
            fs.rmSync('./test/assets/temp.txt')
            await new Promise<undefined>(resolve => setTimeout(() => resolve(undefined), 20))
            expect(await watcher.lookup('temp.txt')).to.be.undefined
        })

        it('should return undefined if searched file is out of the root directory', async function() {
            const watcher = new FileWatcher('./test/assets', [], [], {})
            cleanup.push(() => watcher.close())
            const file = await watcher.lookup('../../LICENSE')
            expect(file).to.be.undefined
        })

        it('should lookup file with extensions', async function() {
            const watcher = new FileWatcher('./test/assets', [], ['.txt'], {})
            cleanup.push(() => watcher.close())
            const file = await watcher.lookup('some')
            expect(file).to.have.property('name').which.is.satisfy((name: string) => name.endsWith('assets/some.txt'))
            expect(file).to.have.property('is_dot').which.equals(false)
        })
    })
})
