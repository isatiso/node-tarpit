/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { describe, expect, it } from 'vitest'
import fs from 'fs'
import { FileWatcher } from './file-watcher'

describe('file-watcher.ts', function() {

    describe('.lookup()', function() {

        it('should lookup file by specified name', async function() {
            const watcher = new FileWatcher('./tests/assets', [], [], { cache_size: 100 })
            const file = await watcher.lookup('some.txt')
            expect(file?.name).to.satisfy((name: string) => name.endsWith('assets/some.txt'))
            expect(file?.is_dot).toBe(false)
        })

        it('should remove cache on file change', async function() {
            const watcher = new FileWatcher('./tests/assets', [], [], {})
            fs.writeFileSync('./tests/assets/temp.txt', 'some random text')
            await watcher.lookup('some.txt')
            expect(await watcher.lookup('temp.txt')).toBeDefined()
            fs.rmSync('./tests/assets/temp.txt')
            await new Promise<undefined>(resolve => setTimeout(() => resolve(undefined), 20))
            expect(await watcher.lookup('temp.txt')).toBeUndefined()
        })

        it('should return undefined if searched file is out of the root directory', async function() {
            const watcher = new FileWatcher('./tests/assets', [], [], {})
            const file = await watcher.lookup('../../LICENSE')
            expect(file).toBeUndefined()
        })

        it('should lookup file with extensions', async function() {
            const watcher = new FileWatcher('./tests/assets', [], ['.txt'], {})
            const file = await watcher.lookup('some')
            expect(file?.name).to.satisfy((name: string) => name.endsWith('assets/some.txt'))
            expect(file?.is_dot).toBe(false)
        })
    })
})
