/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import LRU from 'lru-cache'
import { match, MatchFunction, MatchResult, parse } from 'path-to-regexp'
import { ApiMethod, FatHttpHandler, HttpHandler, HttpHandlerDescriptor } from '../__types__'

export interface HttpHandlerMap {
    GET?: FatHttpHandler
    POST?: FatHttpHandler
    PUT?: FatHttpHandler
    DELETE?: FatHttpHandler
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
    private _handler_cache = new LRU<`${ApiMethod}-${string}`, HttpHandler | undefined>({ max: 200, ttl: 86400000 })

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

    record(method: ApiMethod, path: string, fat_handler: FatHttpHandler) {
        method = method.toUpperCase() as any
        if (this._index[path]) {
            this._update_handler_node(this._index[path].map, method, fat_handler)
        } else {
            const handler_node: HttpHandlerMap = { _allows: ['OPTIONS'] }
            this._update_handler_node(handler_node, method, fat_handler)

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

    find(method: string, path: string): HttpHandler | undefined {
        method = method.toUpperCase()
        const regular_method: ApiMethod = method === 'HEAD' ? 'GET' : method as any
        const key = `${regular_method}-${path}` as const
        if (!this._handler_cache.has(key)) {
            const search_result = this._search_with_cache(path)
            const fat_handler = search_result?.map[regular_method]
            if (fat_handler) {
                const path_args = search_result.result?.params
                const handler: HttpHandler = (req, res, url) => fat_handler(req, res, url, path_args)
                this._handler_cache.set(key, handler)
            } else {
                this._handler_cache.set(key, undefined)
            }
        }
        return this._handler_cache.get(key)
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
        this._handler_cache.clear()
    }

    private _update_handler_node(node: HttpHandlerMap, method: ApiMethod, handler: FatHttpHandler) {
        node[method] = handler
        if (!node._allows.includes(method)) {
            method === 'GET' ? node._allows.push('HEAD', 'GET') : node._allows.push(method)
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
