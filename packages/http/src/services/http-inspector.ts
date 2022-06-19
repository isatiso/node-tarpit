/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */
import { TpService } from '@tarpit/core'
import { ApiMethod, HttpHandler, HttpHandlerDescriptor } from '../__types__'
import { HttpRouters } from './http-routers'

@TpService()
export class HttpInspector {

    constructor(
        private _routers: HttpRouters
    ) {
    }

    list_router(): Omit<HttpHandlerDescriptor, 'handler'>[]
    list_router(need_handler: false): Omit<HttpHandlerDescriptor, 'handler'>[]
    list_router(need_handler: true): HttpHandlerDescriptor[]
    list_router(need_handler?: boolean): HttpHandlerDescriptor[] | Omit<HttpHandlerDescriptor, 'handler'>[] {
        return Array.from(this._routers.handlers.keys()).sort().map(mp => {
            const [, method, path] = /^(GET|POST|PUT|DELETE)-(.+)$/.exec(mp) ?? []
            return {
                path,
                method: method as ApiMethod,
                handler: need_handler ? this._routers.handlers.get(mp) : undefined
            }
        })
    }

    bind(method: ApiMethod, path: string | string[], handler: HttpHandler): void {
        if (Array.isArray(path)) {
            for (const p of path) {
                this._routers.handlers.set(`${method}-${p}`, handler)
            }
        } else {
            this._routers.handlers.set(`${method}-${path}`, handler)
        }
    }
}
