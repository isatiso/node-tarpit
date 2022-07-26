/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ContentReaderService, MIMEContent } from '@tarpit/content-type'
import { get_providers, Injector, TpService } from '@tarpit/core'
import { ConsumeMessage } from 'amqplib'
import { TpConsumer } from '../annotations'
import { Consumer } from '../builtin/consumer'
import { RabbitMessage } from '../builtin/rabbit-message'
import { Ack, ack_message, MessageDead, MessageError, MessageRequeue } from '../errors'
import { ConsumeUnit } from '../tools/collect-consumes'
import { RabbitHooks } from './rabbit-hooks'

const EXCEPT_TOKEN_SET = new Set([RabbitMessage])

@TpService({ inject_root: true })
export class RabbitConsumer extends Array<[meta: TpConsumer, units: ConsumeUnit[]]> {

    constructor(
        private content_reader: ContentReaderService,
    ) {
        super()
    }

    add(meta: TpConsumer, units: ConsumeUnit[]) {
        for (const unit of units) {
            this.put_consumer(meta.injector!, unit)
        }
    }

    private put_consumer(injector: Injector, unit: ConsumeUnit): void {
        const content_reader = this.content_reader
        const consumer = new Consumer(injector)
        const rabbit_hooks_provider = injector.get(RabbitHooks)!
        const param_deps = get_providers(unit, injector, EXCEPT_TOKEN_SET)

        const on_message = async function(msg: ConsumeMessage): Promise<void> {

            const hooks = rabbit_hooks_provider.create()

            let content: MIMEContent<any> | undefined = undefined
            let handle_result: Ack | MessageError

            async function handle(msg: ConsumeMessage) {

                await hooks.on_init(msg)

                const content_type = msg.properties.contentType || 'application/json; charset=utf-8'
                const content_encoding = msg.properties.contentEncoding || 'identity'

                const content = await content_reader.read(msg.content, { content_encoding, content_type })

                return unit.handler(...param_deps.map(({ provider, token }, index) => {
                    if (provider) {
                        return provider.create([{ token: `${unit.cls.name}.${unit.prop.toString()}`, index }])
                    }
                    switch (token) {
                        case RabbitMessage:
                            return new RabbitMessage(msg, content)
                    }
                }))
            }

            try {
                await handle(msg)
                ack_message()
            } catch (reason) {
                if (reason instanceof Ack || reason instanceof MessageError) {
                    handle_result = reason
                } else {
                    handle_result = new MessageDead({ code: 500, msg: 'Internal Server Error', origin: reason })
                }
            }

            if (handle_result instanceof Ack) {
                await hooks.on_ack(msg, content)
                consumer.ack(msg)
            } else if (handle_result instanceof MessageRequeue) {
                await hooks.on_requeue(msg, content, handle_result)
                consumer.requeue(msg)
            } else {
                await hooks.on_dead(msg, content, handle_result)
                consumer.kill(msg)
            }
        }

        consumer.consume(unit.queue, msg => msg && on_message(msg).then(), unit.options)
    }
}
