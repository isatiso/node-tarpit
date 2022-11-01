/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpLoader, TpModule } from '@tarpit/core'
import { TpMongoToken } from './annotations/__token__'
import { TpMongo } from './annotations/tp-mongo'
import { MongoHubService } from './services/mongo-hub.service'

@TpModule({
    providers: [
        MongoHubService,
    ]
})
export class MongodbModule {

    constructor(
        private loader: TpLoader,
        private hub: MongoHubService,
    ) {
        this.loader.register(TpMongoToken, {
            on_start: async () => this.hub.start(),
            on_terminate: async () => this.hub.stop(),
            on_load: (meta: TpMongo) => meta instanceof TpMongo && this.hub.load(meta),
        })
    }
}
