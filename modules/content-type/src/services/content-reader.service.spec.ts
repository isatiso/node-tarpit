/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Platform } from '@tarpit/core'
import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { ContentTypeModule } from '../content-type.module'
import { ContentReaderService, get_default_charset } from './content-reader.service'

chai.use(cap)

describe('content-reader.service.ts', function() {

    describe('ContentDeserializerService.deserialize()', function() {

        const platform = new Platform({})
            .import(ContentTypeModule)

        const reader = platform.expose(ContentReaderService)!

        it('should read raw content', async function() {
            const raw = Buffer.from('H4sIAAAAAAAAE6tWSlSyUvowv2e/wou9u5/Nn/J8VouSjlKSkpWRoXEtALBm6nUeAAAA', 'base64')
            const result = await reader.read(raw, { content_encoding: 'gzip', content_type: 'application/json' })
            expect(result.text).to.equal('{"a":"🌿 轻柔的","b":213}')
            expect(result.data).to.eql({ a: '🌿 轻柔的', b: 213 })
        })

        it('should skip deserialize if specified', async function() {
            const raw = Buffer.from('H4sIAAAAAAAAE6tWSlSyUvowv2e/wou9u5/Nn/J8VouSjlKSkpWRoXEtALBm6nUeAAAA', 'base64')
            const result = await reader.read(raw, { content_encoding: 'gzip', content_type: 'application/json', skip_deserialize: true })
            expect(result.text).to.be.undefined
            expect(result.data).to.be.undefined
        })

        it('could deserialize directly', async function() {
            const content = {
                type: 'application/json',
                parameters: {},
                charset: 'UTF-8',
                raw: Buffer.from('7b2261223a22f09f8cbf20e8bdbbe69f94e79a84222c2262223a3231337d', 'hex')
            }

            const result = await reader.deserialize(content)
            expect(result.text).to.equal('{"a":"🌿 轻柔的","b":213}')
            expect(result.data).to.eql({ a: '🌿 轻柔的', b: 213 })
        })

        it('should use given charset if specified', async function() {
            const raw = Buffer.from('H4sIAAAAAAAAE6tWSlSyUvowv2e/wou9u5/Nn/J8VouSjlKSkpWRoXEtALBm6nUeAAAA', 'base64')
            const result = await reader.read(raw, { content_encoding: 'gzip', content_type: 'application/json; charset=utf-8' })
            expect(result.text).to.equal('{"a":"🌿 轻柔的","b":213}')
            expect(result.data).to.eql({ a: '🌿 轻柔的', b: 213 })
        })
    })

    describe('get_default_charset()', function() {
        it('could search default charset of specified MIME type', async function() {
            expect(get_default_charset('application/json')).to.equal('UTF-8')
        })

        it('should return undefined if given type is undefined', async function() {
            expect(get_default_charset(undefined)).to.be.undefined
        })

        it('should return undefined if given type not found or no default charset', async function() {
            expect(get_default_charset('undefined')).to.be.undefined
            expect(get_default_charset('video/mp4')).to.be.undefined
        })
    })
})
