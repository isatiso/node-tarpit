/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ContentTypeModule } from '@tarpit/content-type'
import { TpLoader, TpModule } from '@tarpit/core'
import { TpRouter, TpRouterToken } from './annotations'
import {
    AbstractAuthenticator,
    AbstractCacheProxy,
    AbstractErrorFormatter,
    AbstractHttpHooks,
    AbstractResponseFormatter,
    HttpInspector,
    HttpRouters,
    HttpServer,
    HttpUrlParser,
    TpAuthenticator,
    TpCacheProxy,
    TpErrorFormatter,
    TpHttpHooks,
    TpResponseFormatter
} from './services'
import { collect_routes } from './tools/collect-routes'

@TpModule({
    inject_root: true,
    imports: [
        ContentTypeModule,
    ],
    providers: [
        HttpUrlParser,
        HttpInspector,
        HttpRouters,
        HttpServer,
        { provide: AbstractCacheProxy, useClass: TpCacheProxy, root: true },
        { provide: AbstractHttpHooks, useClass: TpHttpHooks, root: true },
        { provide: AbstractAuthenticator, useClass: TpAuthenticator, root: true },
        { provide: AbstractResponseFormatter, useClass: TpResponseFormatter, root: true },
        { provide: AbstractErrorFormatter, useClass: TpErrorFormatter, root: true },
    ]
})
export class HttpServerModule {

    constructor(
        private loader: TpLoader,
        private server: HttpServer,
        private routers: HttpRouters,
    ) {
        this.loader.register(TpRouterToken, {
            on_start: async () => this.server.start(this.routers.request_listener),
            on_terminate: async () => this.server.terminate(),
            on_load: async (meta: any) => {
                if (meta instanceof TpRouter) {
                    collect_routes(meta).forEach(f => this.routers.add_router(f, meta))
                }
            },
        })
    }
}
