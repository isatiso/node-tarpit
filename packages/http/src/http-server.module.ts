/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */
import { Injector, TpLoader, TpLoaderType, TpModule } from '@tarpit/core'
import { TpRouter, TpRouterToken } from './annotations'
import {
    AbstractAuthenticator,
    AbstractCacheProxy,
    AbstractErrorFormatter,
    AbstractHttpDecompressor,
    AbstractHttpHooks,
    AbstractResponseFormatter,
    HttpBodyReader,
    HttpInspector,
    HttpRouters,
    HttpServer,
    HttpUrlParser,
    TpAuthenticator,
    TpCacheProxy,
    TpErrorFormatter,
    TpHttpDecompressor,
    TpHttpHooks,
    TpResponseFormatter
} from './services'
import { collect_routes } from './tools/collect-routes'

@TpModule({
    inject_root: true,
    providers: [
        HttpUrlParser,
        HttpBodyReader,
        HttpInspector,
        HttpRouters,
        HttpServer,
        { provide: AbstractHttpDecompressor, useClass: TpHttpDecompressor, root: true },
        { provide: AbstractCacheProxy, useClass: TpCacheProxy, root: true },
        { provide: AbstractHttpHooks, useClass: TpHttpHooks, root: true },
        { provide: AbstractAuthenticator, useClass: TpAuthenticator, root: true },
        { provide: AbstractResponseFormatter, useClass: TpResponseFormatter, root: true },
        { provide: AbstractErrorFormatter, useClass: TpErrorFormatter, root: true },
    ]
})
export class HttpServerModule {

    private _server = this.injector.get(HttpServer)?.create()!
    private _routers = this.injector.get(HttpRouters)?.create()!

    constructor(private injector: Injector) {
        console.log('is root injector', injector.root === injector)
        const loader_obj: TpLoaderType = {
            on_start: async () => this._server.start(this._routers.request_listener),
            on_terminate: async () => this._server.terminate(),
            on_load: async (meta: any) => {
                if (meta instanceof TpRouter) {
                    collect_routes(meta).forEach(f => this._routers.add_router(f, meta))
                }
            },
        }
        this.injector.get(TpLoader)?.create().register(TpRouterToken, loader_obj)
    }
}
