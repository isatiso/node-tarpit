/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpLoader, TpModule } from '@tarpit/core'
import { TpConsumer, TpProducer, TpRabbitMQToken } from './annotations'
import { RabbitHooks } from './services/impl/rabbit-hooks'
import { RabbitMessageReader } from './services/impl/rabbit-message-reader'
import { AbstractRabbitHooks } from './services/inner/abstract-rabbit-hooks'
import { AbstractRabbitMessageReader } from './services/inner/abstract-rabbit-message-reader'
import { RabbitClient } from './services/rabbit-client'
import { RabbitConnector } from './services/rabbit-connector'
import { RabbitConsumer } from './services/rabbit-consumer'
import { RabbitProducer } from './services/rabbit-producer'
import { RabbitSessionCollector } from './services/rabbit-session-collector'
import { collect_consumes, collect_produces } from './tools'

@TpModule({
    inject_root: true,
    providers: [
        RabbitClient,
        RabbitConnector,
        RabbitConsumer,
        RabbitProducer,
        RabbitSessionCollector,
        { provide: AbstractRabbitHooks, useClass: RabbitHooks },
        { provide: AbstractRabbitMessageReader, useClass: RabbitMessageReader },
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
                    this.consumers.push([meta, collect_consumes(meta)])
                } else if (meta instanceof TpProducer) {
                    this.producers.add_producer(meta, collect_produces(meta))
                }
            },
        })
    }
}
