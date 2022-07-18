/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ContentTypeModule } from '@tarpit/content-type'
import { SymbolToken, TpLoader, TpModule } from '@tarpit/core'
import { TpConsumer, TpProducer, TpRabbitMQToken } from './annotations'
import { RabbitHooks } from './services/impl/rabbit-hooks'
import { AbstractRabbitHooks } from './services/inner/abstract-rabbit-hooks'
import { RabbitClient } from './services/rabbit-client'
import { RabbitConnector } from './services/rabbit-connector'
import { RabbitConsumer } from './services/rabbit-consumer'
import { RabbitProducer } from './services/rabbit-producer'
import { RabbitSessionCollector } from './services/rabbit-session-collector'
import { collect_consumes, collect_produces } from './tools'

@SymbolToken('rabbitmq')
@TpModule({
    inject_root: true,
    imports: [
        ContentTypeModule,
    ],
    providers: [
        RabbitClient,
        RabbitConnector,
        RabbitConsumer,
        RabbitProducer,
        RabbitSessionCollector,
        { provide: AbstractRabbitHooks, useClass: RabbitHooks },
    ],
})
export class RabbitMQModule {

    constructor(
        private rabbit: RabbitClient,
        private loader: TpLoader,
        private consumers: RabbitConsumer,
        private producers: RabbitProducer,
    ) {
        this.loader.register(TpRabbitMQToken, {
            on_start: async () => this.rabbit.start(),
            on_terminate: async () => this.rabbit.terminate(),
            on_load: (meta: any) => {
                if (meta instanceof TpConsumer) {
                    this.consumers.add(meta, collect_consumes(meta))
                } else if (meta instanceof TpProducer) {
                    this.producers.add(meta, collect_produces(meta))
                }
            },
        })
    }
}
