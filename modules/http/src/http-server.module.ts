/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ContentTypeModule } from '@tarpit/content-type'
import { TpLoader, TpModule } from '@tarpit/core'
import { TpHttpToken, TpRouter } from './annotations'
import { HttpAuthenticator } from './services/http-authenticator'
import { HttpBodyFormatter } from './services/http-body-formatter'
import { HttpCacheProxy } from './services/http-cache-proxy'
import { HttpHooks } from './services/http-hooks'
import { HttpInspector } from './services/http-inspector'
import { HttpRouters } from './services/http-routers'
import { HttpServer } from './services/http-server'
import { HttpStatic } from './services/http-static'
import { HttpUrlParser } from './services/http-url-parser'
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
        HttpStatic,
        HttpServer,
        HttpCacheProxy,
        HttpHooks,
        HttpAuthenticator,
        HttpBodyFormatter,
    ]
})
export class HttpServerModule {

    constructor(
        private loader: TpLoader,
        private server: HttpServer,
        private routers: HttpRouters,
    ) {
        this.loader.register(TpHttpToken, {
            on_start: async () => this.server.start(this.routers.request_listener, this.routers.upgrade_listener),
            on_terminate: async () => this.server.terminate(),
            on_load: async (meta: TpRouter) => collect_routes(meta).forEach(f => this.routers.add_router(f, meta)),
        })
    }
}
