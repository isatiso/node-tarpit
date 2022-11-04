/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { parse, match, MatchFunction, Match } from 'path-to-regexp'
import { ApiMethod, HttpHandler, HttpHandlerDescriptor } from '../__types__'

interface HttpHandlerMap {
    GET?: HttpHandler
    POST?: HttpHandler
    PUT?: HttpHandler
    DELETE?: HttpHandler
    _allows: (ApiMethod | 'HEAD' | 'OPTIONS')[]
}

interface RegExpNode {
    match: MatchFunction
    handler: HttpHandlerMap
}

interface PathNode {
    children: { [segment: string]: PathNode }
    matchers: RegExpNode[]
    handler?: HttpHandlerMap
}

export class HandlerBook {

    private book = new Map<string, HttpHandlerMap>()

    private index: { [path: string]: { handler: HttpHandlerMap } } = {}
    private root: PathNode = { children: {}, matchers: [] }

    init_path_node(segments: string[]) {
        let node = this.root
        for (const segment of segments) {
            if (!node.children[segment]) {
                node.children[segment] = { children: {}, matchers: [] }
            }
            node = node.children[segment]
        }
        return node
    }

    update_handler_node(node: HttpHandlerMap, method: ApiMethod, handler: HttpHandler) {
        node[method] = handler
        if (!node._allows.includes(method)) {
            method === 'GET' ? node._allows.push('HEAD', 'GET') : node._allows.push(method)
        }
    }

    record(method: ApiMethod, path: string, handler: HttpHandler) {
        method = method.toUpperCase() as any
        if (this.index[path]) {
            this.update_handler_node(this.index[path].handler, method, handler)
        } else {
            const handler_node: HttpHandlerMap = { _allows: ['OPTIONS'] }
            this.update_handler_node(handler_node, method, handler)

            const tokens = parse(path)
            if (typeof tokens[0] === 'string') {
                const static_path = tokens[0].replace(/^\//g, '').split('/')
                const node = this.init_path_node(static_path)
                if (tokens[1]) {
                    const regex_node = { match: match(path), handler: handler_node }
                    node.matchers.push(regex_node)
                    this.index[path] = regex_node
                } else {
                    node.handler = handler_node
                    this.index[path] = node as { handler: HttpHandlerMap }
                }
            }
        }

        // const regular_method = method.toUpperCase() as ApiMethod
        // if (!this.book.has(path)) {
        //     this.book.set(path, { _allows: ['OPTIONS'] })
        // }
        // const map = this.book.get(path)!
        // map[regular_method] = handler
        // if (!map._allows.includes(method)) {
        //     method === 'GET' ? map._allows.push('HEAD', 'GET') : map._allows.push(method)
        // }
    }

    search_node(path: string): { type: 'path', node: PathNode } | { type: 'matcher', node: RegExpNode, result: Match } | undefined {
        if (path === '/' || path === '*') {
            return { type: 'path', node: this.root }
        }
        const segments = path.replace(/^\//g, '').split('/')
        let node = this.root
        for (const segment of segments) {
            if (node.children[segment]) {
                node = node.children[segment]
                continue
            }
            for (const matcher of node.matchers) {
                const result = matcher.match(path)
                if (result) {
                    return { type: 'matcher', node: matcher, result }
                }
            }
            return
        }
        if (node.handler) {
            return { type: 'path', node }
        } else {
            return
        }
    }

    find(method: string, path: string): HttpHandler | undefined {
        const regular_method = method.toUpperCase() as ApiMethod | 'HEAD'
        if (regular_method === 'HEAD') {
            return this.book.get(path)?.['GET']
        } else {
            return this.book.get(path)?.[regular_method]
        }
    }

    get_allow(path: string): string[] | undefined {
        return this.book.get(path)?._allows
    }

    list(): HttpHandlerDescriptor[] {
        const res: HttpHandlerDescriptor[] = []
        this.book.forEach((v, path) => {
            Object.entries(v).forEach(([method]) => {
                method.startsWith('_') || res.push({ method: method as ApiMethod, path })
            })
        })
        return res.sort((a, b) => a.path.localeCompare(b.path))
    }
}
