/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Injector, TpLoader, TpModule } from '@tarpit/core'
import { TpThreadToken } from './annotations/__token__'
import { TpThread } from './builtin/tp-thread'

@TpModule({})
export class WorkerThreadsModule {

    constructor(
        private injector: Injector,
        private loader: TpLoader,
        private thread: TpThread,
    ) {
        this.injector.on('start', () => this.thread.start())
        this.injector.on('terminate', () => this.thread.terminate())
        this.loader.register(TpThreadToken, {
            on_start: async () => this.thread.start(),
            on_terminate: async () => this.thread.terminate(),
            on_load: (meta: TpThread) => void 0,
        })
    }

}
