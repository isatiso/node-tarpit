/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform } from '@tarpit/core'
import { describe, it, expect } from 'vitest'
import { Readable, Transform } from 'stream'
import zlib from 'zlib'
import { text_deserialize } from '../builtin/text'
import { ContentTypeModule } from '../content-type.module'
import { decompressor_token, deserializer_token } from '../tokens'
import { ContentDecompressorService } from './content-decompressor.service'

describe('content-decompressor.service.ts', function() {

    describe('ContentDecompressorService', function() {

        describe('.decompress()', function() {

            const platform = new Platform(load_config({}))
                .import(ContentTypeModule)

            const decompressor = platform.expose(ContentDecompressorService)!

            it('should decoded deflate encoded content', async function() {
                // deflate encoded '恢复神经系统🌿 轻柔的音乐，镇静神经系统，愉悦心灵'
                const raw = Buffer.from('eJx71rjo6ZLe50vnPd/d/3zz7ue753+Y37Nf4cXe3c/mT3k+q+Xl/M1Pdk54v6fn5dT2l3NnIisECj5r6XzWtOzp/ubnjVsBvhQ0uQ==', 'base64')
                const decompressed = await decompressor.decompress(raw, { content_encoding: 'deflate' })
                expect(decompressed.toString()).toEqual('恢复神经系统🌿 轻柔的音乐，镇静神经系统，愉悦心灵')
            })

            it('should decoded brotli encoded content', async function() {
                // brotli encoded '恢复神经系统🌿 轻柔的音乐，镇静神经系统，愉悦心灵'
                const raw = Buffer.from('G0kA+I3UUQ3b3UAHR5qQZdTWqaydwzy/vqReFgaKL2FYZLrXkvCSD0cSB2Ri2tCcFd1DJC+EvkrXfqDZxtk6kxSfXvlM4IA7Qw56', 'base64')
                const decompressed = await decompressor.decompress(raw, { content_encoding: 'br' })
                expect(decompressed.toString()).toEqual('恢复神经系统🌿 轻柔的音乐，镇静神经系统，愉悦心灵')
            })

            it('should decoded gzip encoded content', async function() {
                // gzip encoded '恢复神经系统🌿 轻柔的音乐，镇静神经系统，愉悦心灵'
                const raw = Buffer.from('H4sIAAAAAAAAE3vWuOjpkt7nS+c9393/fPPu57vnf5jfs1/hxd7dz+ZPeT6r5eX8zU92Tni/p+fl1PaXc2ciKwQKPmvpfNa07On+5ueNWwG42Gy8SgAAAA==', 'base64')
                const decompressed = await decompressor.decompress(raw, { content_encoding: 'gzip' })
                expect(decompressed.toString()).toEqual('恢复神经系统🌿 轻柔的音乐，镇静神经系统，愉悦心灵')
            })

            it('should return it self if given encoding is identity', async function() {
                // '恢复神经系统🌿 轻柔的音乐，镇静神经系统，愉悦心灵'
                const raw_str = '5oGi5aSN56We57uP57O757uf8J+MvyDovbvmn5TnmoTpn7PkuZDvvIzplYfpnZnnpZ7nu4/ns7vnu5/vvIzmhInmgqblv4PngbU='
                const raw = Buffer.from(raw_str, 'base64')
                const decompressed = await decompressor.decompress(raw, { content_encoding: 'identity' })
                expect(decompressed.toString('base64')).toEqual(raw_str)
            })

            it('should return it self if given encoding not found', async function() {
                // '恢复神经系统🌿 轻柔的音乐，镇静神经系统，愉悦心灵'
                const raw_str = '5oGi5aSN56We57uP57O757uf8J+MvyDovbvmn5TnmoTpn7PkuZDvvIzplYfpnZnnpZ7nu4/ns7vnu5/vvIzmhInmgqblv4PngbU='
                const raw = Buffer.from(raw_str, 'base64')
                const decompressed = await decompressor.decompress(raw, { content_encoding: 'bla' })
                expect(decompressed.toString('base64')).toEqual(raw_str)
            })

            it('should decoded content that encoded orderly by deflate, gzip, brotli and identity', async function() {
                // deflate,gzip,br encoded '恢复神经系统🌿 轻柔的音乐，镇静神经系统，愉悦心灵'
                const raw = Buffer.from('CzGAH4sIAAAAAAAAEwFMALP/eJx71rjo6ZLe50vnPd/d/3zz7ue753+Y37Nf4cXe3c/mT3k+q+Xl/M1Pdk54v6fn5dT2l3NnIisECj5r6XzWtOzp/ubnjVsBvhQ0uezUsxlMAAAAAw==', 'base64')
                const decompressed = await decompressor.decompress(raw, { content_encoding: 'deflate,gzip,br,bla,identity' })
                expect(decompressed.toString()).toEqual('恢复神经系统🌿 轻柔的音乐，镇静神经系统，愉悦心灵')
            })

            it('should accept Readable stream', async function() {
                // deflate,gzip,br encoded '恢复神经系统🌿 轻柔的音乐，镇静神经系统，愉悦心灵'
                const raw = Buffer.from('H4sIAAAAAAAAE3vWuOjpkt7nS+c9393/fPPu57vnf5jfs1/hxd7dz+ZPeT6r5eX8zU92Tni/p+fl1PaXc2ciKwQKPmvpfNa07On+5ueNWwG42Gy8SgAAAA==', 'base64')
                const decompressed = await decompressor.decompress(Readable.from(raw), { content_encoding: 'gzip' })
                expect(decompressed.toString()).toEqual('恢复神经系统🌿 轻柔的音乐，镇静神经系统，愉悦心灵')
            })
        })

        describe('.load_decompressor()', function() {

            const platform = new Platform(load_config({}))
                .import(ContentDecompressorService)
                .import({
                    provide: decompressor_token, useValue: ['err', (req: Readable) => req.pipe(new Transform({
                        transform(_chunk, _encoding, callback) {
                            callback(new Error('lkj'))
                        }
                    }))], multi: true, root: true
                })

            const decompressor = platform.expose(ContentDecompressorService)!

            it('should load gzip decompressor by import', async function() {
                // gzip encoded '恢复神经系统🌿 轻柔的音乐，镇静神经系统，愉悦心灵'
                const raw_str = 'H4sIAAAAAAAAE3vWuOjpkt7nS+c9393/fPPu57vnf5jfs1/hxd7dz+ZPeT6r5eX8zU92Tni/p+fl1PaXc2ciKwQKPmvpfNa07On+5ueNWwG42Gy8SgAAAA=='
                const raw = Buffer.from(raw_str, 'base64')
                const failed_decompressed = await decompressor.decompress(raw, { content_encoding: 'gzip' })
                expect(failed_decompressed.toString('base64')).toEqual(raw_str)

                platform.import({ provide: decompressor_token, useValue: ['gzip', (req: Readable) => req.pipe(zlib.createGunzip())], multi: true, root: true })
                const succeed_decompressed = await decompressor.decompress(raw, { content_encoding: 'gzip' })
                expect(succeed_decompressed.toString()).toEqual('恢复神经系统🌿 轻柔的音乐，镇静神经系统，愉悦心灵')
            })

            it('should ignore event "provider-change" except accepted token is Symbol(decompressor_token)', async function() {
                platform.import({ provide: deserializer_token, useValue: ['text/plain', text_deserialize], multi: true, root: true })
            })

            it('should handle error event', async function() {
                const raw = Buffer.from('eJx71rjo6ZLe50vnPd/d/3zz7ue753+Y37Nf4cXe3c/mT3k+q+Xl/M1Pdk54v6fn5dT2l3NnIisECj5r6XzWtOzp/ubnjVsBvhQ0uQ==', 'base64')
                await expect(decompressor.decompress(raw, { content_encoding: 'err' })).rejects.toThrow()
            })
        })
    })
})
