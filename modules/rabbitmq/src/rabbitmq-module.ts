/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ContentTypeModule } from '@tarpit/content-type'
import { TpLoader, TpModule } from '@tarpit/core'
import { TpConsumer, TpProducer, TpRabbitmqToken } from './annotations'
import { RabbitClient } from './services/rabbit-client'
import { RabbitConnector } from './services/rabbit-connector'
import { RabbitConsumer } from './services/rabbit-consumer'
import { RabbitDefine, RabbitDefineToken } from './services/rabbit-define'
import { RabbitHooks } from './services/rabbit-hooks'
import { RabbitProducer } from './services/rabbit-producer'
import { RabbitRetryStrategy } from './services/rabbit-retry-strategy'
import { RabbitSessionCollector } from './services/rabbit-session-collector'
import { collect_consumes } from './tools/collect-consumes'
import { collect_produces } from './tools/collect-produces'

@TpModule({
    inject_root: true,
    imports: [
        ContentTypeModule,
    ],
    providers: [
        RabbitClient,
        RabbitConnector,
        RabbitConsumer,
        RabbitHooks,
        RabbitProducer,
        RabbitRetryStrategy,
        RabbitSessionCollector,
        { provide: RabbitDefineToken, useValue: new RabbitDefine(), multi: true, root: true },
    ],
})
export class RabbitmqModule {

    constructor(
        private client: RabbitClient,
        private loader: TpLoader,
        private consumers: RabbitConsumer,
        private producers: RabbitProducer,
    ) {
        this.loader.register(TpRabbitmqToken, {
            on_start: async () => this.client.start(),
            on_terminate: async () => this.client.terminate(),
            on_load: (meta: TpConsumer | TpProducer) => {
                meta instanceof TpConsumer && this.consumers.add(meta, collect_consumes(meta))
                meta instanceof TpProducer && this.producers.add(meta, collect_produces(meta))
            },
        })
    }
}
