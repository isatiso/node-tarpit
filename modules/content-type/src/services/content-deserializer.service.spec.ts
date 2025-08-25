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
import { Readable } from 'stream'
import zlib from 'zlib'
import { ContentTypeModule } from '../content-type.module'
import { decompressor_token } from '../tokens'
import { ContentDeserializerService } from './content-deserializer.service'

describe('content-deserializer.service.ts', function() {

    describe('ContentDeserializerService', function() {

        describe('.deserialize()', function() {

            const platform = new Platform(load_config({}))
                .import(ContentTypeModule)

            const deserializer = platform.expose(ContentDeserializerService)!

            it('should parse text content', async function() {
                const raw_str = '恢复神经系统🌿 轻柔的音乐，镇静神经系统，愉悦心灵'
                const raw = Buffer.from(raw_str)
                const deserialized = await deserializer.deserialize({ raw, type: 'text/plain', charset: 'utf-8', parameters: { charset: 'utf-8' } })
                expect(deserialized.data).toEqual(raw_str)
            })

            it('should parse json content', async function() {
                const raw = Buffer.from('{"a":123,"b":"abc"}')
                const deserialized = await deserializer.deserialize({ raw, type: 'application/json', charset: 'utf-8', parameters: { charset: 'utf-8' } })
                expect(deserialized.data).toEqual({ a: 123, b: 'abc' })
            })

            it('should parse urlencoded content', async function() {
                const raw = Buffer.from('a=123&b=abc&b=q&b=t')
                const deserialized = await deserializer.deserialize({ raw, type: 'application/x-www-form-urlencoded', charset: 'utf-8', parameters: { charset: 'utf-8' } })
                expect(deserialized.data).toEqual({ a: '123', b: ['abc', 'q', 't'] })
            })

            it('should return raw data if given type is "application/octet-stream"', async function() {
                const raw = Buffer.from('{"a":123,"b":"abc"}')
                const deserialized = await deserializer.deserialize({ raw, type: 'application/octet-stream', charset: undefined, parameters: {} })
                expect(deserialized.data).toEqual(raw)
            })

            it('should do nothing if given type is empty', async function() {
                const raw = Buffer.from('{"a":123,"b":"abc"}')
                const deserialized = await deserializer.deserialize({ raw, type: undefined, charset: 'utf-8', parameters: { charset: 'utf-8' } })
                expect(deserialized.data).toBeUndefined()
            })
        })

        describe('.load_decompressor()', function() {

            const platform = new Platform(load_config({}))
                .import(ContentDeserializerService)

            const deserializer = platform.expose(ContentDeserializerService)!

            it('should parse json content by import', async function() {
                const raw = Buffer.from('{"a":123,"b":"abc"}')
                const failed_deserialized = await deserializer.deserialize({ raw, type: 'application/json', charset: 'utf-8', parameters: { charset: 'utf-8' } })
                expect(failed_deserialized.data).toBeUndefined()
            })

            it('should ignore event "provider-change" except accepted token is Symbol(decompressor_token)', async function() {
                platform.import({ provide: decompressor_token, useValue: ['gzip', (req: Readable) => req.pipe(zlib.createGunzip())], multi: true, root: true })
            })
        })
    })
})
