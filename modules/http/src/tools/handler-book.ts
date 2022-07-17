/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ApiMethod, HttpHandler, HttpHandlerDescriptor } from '../__types__'

interface HttpHandlerMap {
    GET?: HttpHandler
    POST?: HttpHandler
    PUT?: HttpHandler
    DELETE?: HttpHandler
    _allows: (ApiMethod | 'HEAD' | 'OPTIONS')[]
}

export class HandlerBook {

    private book = new Map<string, HttpHandlerMap>()

    record(method: ApiMethod, path: string, handler: HttpHandler) {
        const regular_method = method.toUpperCase() as ApiMethod
        if (!this.book.has(path)) {
            this.book.set(path, { _allows: ['OPTIONS'] })
        }
        const map = this.book.get(path)!
        map[regular_method] = handler
        if (!map._allows.includes(method)) {
            method === 'GET' ? map._allows.push('HEAD', 'GET') : map._allows.push(method)
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
