/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */
import { WebSocketServer } from 'ws'

const server = new WebSocketServer({ port: 1111 })
server.on('connection', ws => {
    ws.on('message', data => {

    })
})

export abstract class BaseWebsocket {
    abstract send(): number
}
