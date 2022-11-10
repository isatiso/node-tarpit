/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ImportsAndProviders } from '@tarpit/core'
import { IncomingMessage, ServerResponse } from 'http'
import { Stream } from 'stream'
import { UrlWithParsedQuery } from 'url'

export type HttpResponseType = null | string | Buffer | Stream | object
export type HttpHandler = (req: IncomingMessage, res: ServerResponse, url: UrlWithParsedQuery) => Promise<void>
export type FatHttpHandler = (req: IncomingMessage, res: ServerResponse, url: UrlWithParsedQuery, path_args: object | undefined) => Promise<void>

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

export interface CacheControl {
    'must-revalidate'?: boolean
    'no-cache'?: boolean
    'no-store'?: boolean
    'no-transform'?: boolean
    'public'?: boolean
    'private'?: boolean
    'proxy-revalidate'?: boolean
    'max-age'?: number
    's-maxage'?: number
}
