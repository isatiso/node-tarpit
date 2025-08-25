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
import { ContentTypeModule } from '../content-type.module'
import { ContentReaderService, get_default_charset } from './content-reader.service'

describe('content-reader.service.ts', function() {

    describe('ContentDeserializerService', function() {

        describe('.deserialize()', function() {

            const platform = new Platform(load_config({}))
                .import(ContentTypeModule)

            const reader = platform.expose(ContentReaderService)!

            it('should read raw content', async function() {
                const raw = Buffer.from('H4sIAAAAAAAAE6tWSlSyUvowv2e/wou9u5/Nn/J8VouSjlKSkpWRoXEtALBm6nUeAAAA', 'base64')
                const result = await reader.read(raw, { content_encoding: 'gzip', content_type: 'application/json' })
                expect(result.text).toEqual('{"a":"🌿 轻柔的","b":213}')
                expect(result.data).toEqual({ a: '🌿 轻柔的', b: 213 })
            })

            it('should skip deserialize if specified', async function() {
                const raw = Buffer.from('H4sIAAAAAAAAE6tWSlSyUvowv2e/wou9u5/Nn/J8VouSjlKSkpWRoXEtALBm6nUeAAAA', 'base64')
                const result = await reader.read(raw, { content_encoding: 'gzip', content_type: 'application/json', skip_deserialize: true })
                expect(result.text).toBeUndefined()
                expect(result.data).toBeUndefined()
            })

            it('could deserialize directly', async function() {
                const content = {
                    type: 'application/json',
                    parameters: {},
                    charset: 'utf-8',
                    raw: Buffer.from('7b2261223a22f09f8cbf20e8bdbbe69f94e79a84222c2262223a3231337d', 'hex')
                }

                const result = await reader.deserialize(content)
                expect(result.text).toEqual('{"a":"🌿 轻柔的","b":213}')
                expect(result.data).toEqual({ a: '🌿 轻柔的', b: 213 })
            })

            it('should use given charset if specified', async function() {
                const raw = Buffer.from('H4sIAAAAAAAAE6tWSlSyUvowv2e/wou9u5/Nn/J8VouSjlKSkpWRoXEtALBm6nUeAAAA', 'base64')
                const result = await reader.read(raw, { content_encoding: 'gzip', content_type: 'application/json; charset=utf-8' })
                expect(result.text).toEqual('{"a":"🌿 轻柔的","b":213}')
                expect(result.data).toEqual({ a: '🌿 轻柔的', b: 213 })
            })
        })
    })

    describe('#get_default_charset()', function() {

        it('could search default charset of specified MIME type', async function() {
            expect(get_default_charset('application/json')).toEqual('utf-8')
        })

        it('should return undefined if given type is undefined', async function() {
            expect(get_default_charset(undefined)).toBeUndefined()
        })

        it('should return undefined if given type not found or no default charset', async function() {
            expect(get_default_charset('undefined')).toBeUndefined()
            expect(get_default_charset('video/mp4')).toBeUndefined()
        })
    })
})
