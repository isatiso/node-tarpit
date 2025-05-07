/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ImportsAndProviders } from '@tarpit/core'
import type { IncomingMessage, ServerResponse } from 'http'
import { Duplex, Stream } from 'stream'
import { UrlWithParsedQuery } from 'url'
import type { WebSocket } from 'ws'

export type HttpResponseType = null | string | Buffer | Stream | object
export type RequestHandler = (req: IncomingMessage, res: ServerResponse, url: UrlWithParsedQuery) => Promise<void>
export type RequestHandlerWithPathArgs = (req: IncomingMessage, res: ServerResponse, url: UrlWithParsedQuery, path_args: object | undefined) => Promise<void>
export type UpgradeHandler = (req: IncomingMessage, socket: Duplex, head: Buffer, parsed_url: UrlWithParsedQuery) => Promise<SocketHandler | undefined>
export type UpgradeHandlerWithPathArgs = (req: IncomingMessage, socket: Duplex, head: Buffer, parsed_url: UrlWithParsedQuery, path_args: object | undefined) => Promise<SocketHandler | undefined>
export type SocketHandler = (req: IncomingMessage, ws: WebSocket) => Promise<void>

export type TpHttpResponseType = null | string | Buffer | Uint8Array | Stream | object

export interface HttpHandlerDescriptor {
    method: ApiMethod,
    path: string
}

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export type ProxyConfig = {
    enable: boolean
    ip_header?: string
    max_ips_count?: number
}

export interface HttpSession {
    process_start?: number
}

export interface HttpCredentials {
    type: string
    credentials: string
}

export interface TpRouterOptions extends ImportsAndProviders {
}

export interface TpWebSocketOptions extends ImportsAndProviders {
}

export type FileType = 'file' | 'directory' | 'block' | 'character' | 'link' | 'fifo' | 'socket' | 'unknown'

export interface FileDesc {
    type: FileType
    name: string
    mtimeMs: number
    ctimeMs: number
    size: number
}
