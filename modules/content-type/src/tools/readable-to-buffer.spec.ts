/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { describe, it, expect } from 'vitest'
import { Readable } from 'stream'
import { readable_to_buffer } from './readable-to-buffer'

describe('readable-to-buffer.ts', function() {

    describe('#readable_to_buffer()', function() {

        const raw_str = '5oGi5aSN56We57uP57O757uf8J+MvyDovbvmn5TnmoTpn7PkuZDvvIzplYfpnZnnpZ7nu4/ns7vnu5/vvIzmhInmgqblv4PngbU='
        const raw = Buffer.from(raw_str, 'base64')

        it('should read readable to buffer', async function() {
            const stream = Readable.from(raw)
            const converted = await readable_to_buffer(stream)
            expect(converted.toString('base64')).toEqual(raw_str)
        })

        it('should handle close event', async function() {
            const stream = Readable.from(raw)
            const promise = readable_to_buffer(stream)
            stream.emit('close')
            await expect(promise).rejects.toThrow('Connection aborted')
        })

        it('should handle error event', async function() {
            const stream = Readable.from(raw)
            const promise = readable_to_buffer(stream)
            stream.emit('error', new Error('error'))
            await expect(promise).rejects.toThrow('error')
        })
    })
})
