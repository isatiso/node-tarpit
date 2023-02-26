/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform } from '@tarpit/core'
import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { Server } from 'net'
import { WebSocketServer } from 'ws'
import { HttpServerModule } from '../http-server.module'
import { HttpServer } from './http-server'

chai.use(cap)

describe('http-server.ts', function() {

    describe('HttpServer', function() {

        it('should start and terminate', async function() {
            const platform = new Platform(load_config({ http: { port: 31254 } }))
                .import(HttpServerModule)
            const http_server = platform.expose(HttpServer)!
            expect(http_server).to.have.property('starting').which.is.undefined
            expect(http_server).to.have.property('terminating').which.is.undefined
            const starting = http_server.start(
                async (_req, _res) => undefined,
                async (_req, _socket, _head) => undefined)
            expect(http_server).to.have.property('starting').which.equals(starting)
            expect(http_server).to.have.property('terminating').which.is.undefined
            await starting
            expect(http_server.server).to.be.instanceof(Server)
            expect(http_server.websocket_server).to.be.instanceof(WebSocketServer)
            const terminating = http_server.terminate()
            expect(http_server).to.have.property('terminating').which.equals(terminating)
            await terminating
        })

        it('should do nothing if calling terminate before start', async function() {
            const platform = new Platform(load_config({ http: { port: 31254 } }))
                .import(HttpServerModule)
            const http_server = platform.expose(HttpServer)!
            const terminating = http_server.terminate()
            expect(http_server).to.have.property('starting').which.is.undefined
            expect(http_server).to.have.property('terminating').which.is.undefined
            await terminating
        })

        it('should return same promise if calling start multi times', async function() {
            const platform = new Platform(load_config({ http: { port: 31254 } }))
                .import(HttpServerModule)
            const http_server = platform.expose(HttpServer)!
            const starting = http_server.start(
                async (_req, _res) => undefined,
                async (_req, _socket, _head) => undefined)
            const start_twice = http_server.start(
                async (_req, _res) => undefined,
                async (_req, _socket, _head) => undefined)
            expect(start_twice).to.equal(starting)
            await starting
            await http_server.terminate()
        })

        it('should return same promise if calling terminate multi times', async function() {
            const platform = new Platform(load_config({ http: { port: 31254 } }))
                .import(HttpServerModule)
            const http_server = platform.expose(HttpServer)!
            await http_server.start(
                async (_req, _res) => undefined,
                async (_req, _socket, _head) => undefined)
            const terminating = http_server.terminate()
            const terminate_twice = http_server.terminate()
            expect(terminating).to.equal(terminate_twice)
            await terminating
        })
    })
})
