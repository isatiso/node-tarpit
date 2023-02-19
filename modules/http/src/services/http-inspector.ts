/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '@tarpit/core'
import { ApiMethod, HttpHandlerDescriptor, RequestHandler } from '../__types__'
import { HttpRouters } from './http-routers'

@TpService({ inject_root: true })
export class HttpInspector {

    constructor(
        private _routers: HttpRouters
    ) {
    }

    list_router(): Omit<HttpHandlerDescriptor, 'handler'>[] {
        return this._routers.handler_book.list()
    }

    bind(method: ApiMethod, path: string, handler: RequestHandler): void {
        this._routers.handler_book.record(path, { type: method, handler })
    }
}
