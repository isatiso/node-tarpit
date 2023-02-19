/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import LRU from 'lru-cache'
import { match, MatchFunction, MatchResult, parse } from 'path-to-regexp'
import { ApiMethod, HttpHandlerDescriptor, RequestHandler, RequestHandlerWithPathArgs, SocketHandler, SocketHandlerWithPathArgs } from '../__types__'

export interface HttpHandlerMap {
    GET?: RequestHandlerWithPathArgs
    POST?: RequestHandlerWithPathArgs
    PUT?: RequestHandlerWithPathArgs
    DELETE?: RequestHandlerWithPathArgs
    SOCKET?: SocketHandlerWithPathArgs
    _allows: (ApiMethod | 'HEAD' | 'OPTIONS')[]
}

export interface RegExpNode {
    match: MatchFunction
    map: HttpHandlerMap
}

export interface PathNode {
    children: { [segment: string]: PathNode }
    matchers: RegExpNode[]
    map?: HttpHandlerMap
}

export type PathSearchResult =
    | { type: 'path', map: HttpHandlerMap, result?: undefined }
    | { type: 'matcher', map: HttpHandlerMap, result: MatchResult }

export class HandlerBook {

    private _root: PathNode = { children: {}, matchers: [] }
    private _index: { [path: string]: { map: HttpHandlerMap } } = {}
    private _path_cache = new LRU<string, PathSearchResult | undefined>({ max: 200, ttl: 86400000 })
    private _request_handler_cache = new LRU<`${ApiMethod}-${string}`, RequestHandler | undefined>({ max: 200, ttl: 86400000 })
    private _socket_handler_cache = new LRU<`SOCKET-${string}`, SocketHandler | undefined>({ max: 200, ttl: 86400000 })

    init_path_node(segments: string[]) {
        let node = this._root
        for (const segment of segments) {
            if (!segment) {
                continue
            }
            if (!node.children[segment]) {
                node.children[segment] = { children: {}, matchers: [] }
            }
            node = node.children[segment]
        }
        return node
    }

    // record(type: 'SOCKET', path: string, socket_handler: SocketHandler): void
    // record(type: ApiMethod, path: string, request_handler: RequestHandler): void
    record<K extends Exclude<keyof HttpHandlerMap, '_allows'>>(path: string, record: { type: K, handler: HttpHandlerMap[K] }): void {
        record.type = record.type.toUpperCase() as any
        if (this._index[path]) {
            this._update_handler_node(this._index[path].map, record)
        } else {
            const handler_node: HttpHandlerMap = { _allows: ['OPTIONS'] }
            this._update_handler_node(handler_node, record)

            const tokens = parse(path)
            if (typeof tokens[0] === 'string') {
                const static_path = tokens[0].replace(/^\//g, '').split('/')
                const node = this.init_path_node(static_path)
                if (tokens[1]) {
                    const regex_node: RegExpNode = { match: match(path), map: handler_node }
                    node.matchers.push(regex_node)
                    this._index[path] = regex_node
                } else {
                    node.map = handler_node
                    this._index[path] = node as { map: HttpHandlerMap }
                }
            } else {
                const regex_node: RegExpNode = { match: match(path), map: handler_node }
                this._root.matchers.push(regex_node)
                this._index[path] = regex_node
            }
        }
    }

    find(type: 'SOCKET', path: string): SocketHandler | undefined
    find(type: ApiMethod, path: string): RequestHandler | undefined
    find(type: string, path: string): RequestHandler | SocketHandler | undefined {
        type = type.toUpperCase()
        const regular_type: ApiMethod | 'SOCKET' = type === 'HEAD' ? 'GET' : type as any
        const search_result = this._search_with_cache(path)
        if (regular_type === 'SOCKET') {
            const key = `${regular_type}-${path}` as const
            if (!this._socket_handler_cache.has(key)) {
                const fat_handler = search_result?.map[regular_type]
                if (fat_handler) {
                    const handler: SocketHandler = (req, ws, url) => fat_handler(req, ws, url, search_result.result?.params)
                    this._socket_handler_cache.set(key, handler)
                } else {
                    this._socket_handler_cache.set(key, undefined)
                }
            }
            return this._socket_handler_cache.get(key)
        } else {
            const key = `${regular_type}-${path}` as const
            if (!this._request_handler_cache.has(key)) {
                const fat_handler = search_result?.map[regular_type]
                if (fat_handler) {
                    const handler: RequestHandler = (req, res, url) => fat_handler(req, res, url, search_result.result?.params)
                    this._request_handler_cache.set(key, handler)
                } else {
                    this._request_handler_cache.set(key, undefined)
                }
            }
            return this._request_handler_cache.get(key)
        }
    }

    get_allow(path: string): string[] | undefined {
        return this._search_with_cache(path)?.map._allows
    }

    list(): HttpHandlerDescriptor[] {
        const res: HttpHandlerDescriptor[] = []
        for (const path in this._index) {
            for (const method in this._index[path].map) {
                if (!method.startsWith('_')) {
                    res.push({ method: method as ApiMethod, path })
                }
            }
        }
        return res.sort((a, b) => a.path.localeCompare(b.path))
    }

    clear_cache() {
        this._path_cache.clear()
        this._socket_handler_cache.clear()
        this._request_handler_cache.clear()
    }

    private _update_handler_node<K extends Exclude<keyof HttpHandlerMap, '_allows'>>(node: HttpHandlerMap, record: { type: K, handler: HttpHandlerMap[K] }) {
        node[record.type] = record.handler
        if (record.type !== 'SOCKET' && !node._allows.includes(record.type)) {
            record.type === 'GET' ? node._allows.push('HEAD', 'GET') : node._allows.push(record.type)
        }
    }

    private _search_with_cache(path: string): PathSearchResult | undefined {
        if (!this._path_cache.has(path)) {
            this._path_cache.set(path, this._search(path))
        }
        return this._path_cache.get(path)
    }

    private _search(path: string): PathSearchResult | undefined {
        if (!path || path === '/' || path === '*') {
            if (!this._root.map) {
                return
            } else {
                return { type: 'path', map: this._root.map }
            }
        }
        const segments = path.replace(/^\//g, '').split('/')
        let node = this._root
        for (const segment of segments) {
            if (node.children[segment]) {
                node = node.children[segment]
                continue
            }
            for (const matcher of node.matchers) {
                const result = matcher.match(path)
                if (result) {
                    return { type: 'matcher', map: matcher.map, result }
                }
            }
            return
        }
        if (node.map) {
            return { type: 'path', map: node.map }
        } else {
            return
        }
    }
}
