/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema } from '@tarpit/core'
import axios, { AxiosInstance } from 'axios'
import { AddressInfo } from 'net'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createGunzip, createBrotliDecompress } from 'zlib'
import { Get, HttpServerModule, TpRouter } from '../src'
import { HttpServer } from '../src/services/http-server'

const large_body = { data: 'x'.repeat(5000) }

@TpRouter('/compress', { imports: [HttpServerModule] })
class CompressionRouter {

    @Get('json')
    async get_json() {
        return large_body
    }

    @Get('small')
    async get_small() {
        return { ok: true }
    }
}

describe('compression - gzip', function() {

    let platform: Platform
    let r: AxiosInstance

    beforeAll(async function() {
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        vi.spyOn(console, 'log').mockImplementation(() => undefined)
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        platform = new Platform(load_config<TpConfigSchema>({
            http: {
                port: 0,
                expose_error: true,
                compression: { enable: true, threshold: 100 },
            }
        })).import(CompressionRouter)
        await platform.start()
        const http_server = platform.expose(HttpServer)!
        const port = (http_server.server!.address() as AddressInfo).port
        r = axios.create({ baseURL: `http://localhost:${port}/compress`, proxy: false, decompress: false })
    })

    afterAll(async function() {
        await platform.terminate()
        vi.restoreAllMocks()
    })

    it('should respond with gzip encoding when client accepts gzip', async function() {
        await r.get('/json', { headers: { 'Accept-Encoding': 'gzip' } }).then(res => {
            expect(res.status).toEqual(200)
            expect(res.headers['content-encoding']).toEqual('gzip')
            expect(res.headers['content-length']).toBeUndefined()
        })
    })

    it('should respond with br encoding when client accepts br', async function() {
        await r.get('/json', { headers: { 'Accept-Encoding': 'br' } }).then(res => {
            expect(res.status).toEqual(200)
            expect(res.headers['content-encoding']).toEqual('br')
        })
    })

    it('should prefer br over gzip when both accepted', async function() {
        await r.get('/json', { headers: { 'Accept-Encoding': 'gzip, br' } }).then(res => {
            expect(res.status).toEqual(200)
            expect(res.headers['content-encoding']).toEqual('br')
        })
    })

    it('should not compress when client does not accept compressed encoding', async function() {
        await r.get('/json', { headers: { 'Accept-Encoding': 'identity' } }).then(res => {
            expect(res.status).toEqual(200)
            expect(res.headers['content-encoding']).toBeUndefined()
            expect(res.headers['content-length']).toBeDefined()
        })
    })

    it('should not compress when body is below threshold', async function() {
        await r.get('/small', { headers: { 'Accept-Encoding': 'gzip' } }).then(res => {
            expect(res.status).toEqual(200)
            expect(res.headers['content-encoding']).toBeUndefined()
        })
    })

    it('should decompress gzip response to correct content', async function() {
        const res = await r.get('/json', { headers: { 'Accept-Encoding': 'gzip' }, responseType: 'stream' })
        const chunks: Buffer[] = []
        await new Promise<void>((resolve, reject) => {
            res.data.pipe(createGunzip()).on('data', (chunk: Buffer) => chunks.push(chunk)).on('end', resolve).on('error', reject)
        })
        const body = JSON.parse(Buffer.concat(chunks).toString())
        expect(body).toEqual(large_body)
    })

    it('should decompress br response to correct content', async function() {
        const res = await r.get('/json', { headers: { 'Accept-Encoding': 'br' }, responseType: 'stream' })
        const chunks: Buffer[] = []
        await new Promise<void>((resolve, reject) => {
            res.data.pipe(createBrotliDecompress()).on('data', (chunk: Buffer) => chunks.push(chunk)).on('end', resolve).on('error', reject)
        })
        const body = JSON.parse(Buffer.concat(chunks).toString())
        expect(body).toEqual(large_body)
    })
})

describe('compression - disabled', function() {

    let platform: Platform
    let r: AxiosInstance

    beforeAll(async function() {
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        vi.spyOn(console, 'log').mockImplementation(() => undefined)
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        platform = new Platform(load_config<TpConfigSchema>({
            http: {
                port: 0,
                expose_error: true,
            }
        }))
            .import(CompressionRouter)
        await platform.start()
        const http_server = platform.expose(HttpServer)!
        const port = (http_server.server!.address() as AddressInfo).port
        r = axios.create({ baseURL: `http://localhost:${port}/compress`, proxy: false, decompress: false })
    })

    afterAll(async function() {
        await platform.terminate()
        vi.restoreAllMocks()
    })

    it('should not compress when compression is not configured', async function() {
        await r.get('/json', { headers: { 'Accept-Encoding': 'gzip' } }).then(res => {
            expect(res.status).toEqual(200)
            expect(res.headers['content-encoding']).toBeUndefined()
            expect(res.headers['content-length']).toBeDefined()
        })
    })
})
