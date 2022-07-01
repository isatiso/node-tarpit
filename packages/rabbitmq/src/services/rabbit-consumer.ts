/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { get_providers, Injector, TpService } from '@tarpit/core'
import { throw_native_error } from '@tarpit/error'
import { ConsumeMessage } from 'amqplib'
import { TpConsumer } from '../annotations'
import { JsonMessage, RabbitConsumeSession, TextMessage } from '../builtin'
import { Ack, ack_message, MessageDead, MessageError, MessageRequeue } from '../errors'
import { ConsumeUnit } from '../tools'
import { AbstractRabbitHooks } from './inner/abstract-rabbit-hooks'
import { AbstractRabbitMessageReader } from './inner/abstract-rabbit-message-reader'
import { RabbitSessionCollector } from './rabbit-session-collector'

const EXCEPT_TOKEN_SET = new Set([TextMessage, JsonMessage])

@TpService({ inject_root: true })
export class RabbitConsumer extends Array<[meta: TpConsumer, units: ConsumeUnit[]]> {

    constructor(
        private message_reader: AbstractRabbitMessageReader,
        private sessions: RabbitSessionCollector,
    ) {
        super()
    }

    add(meta: TpConsumer, units: ConsumeUnit[]) {
        for (const unit of units) {
            this.put_consumer(meta.injector!, unit)
        }
    }

    private put_consumer(injector: Injector, unit: ConsumeUnit): void {
        const message_reader = this.message_reader
        const rabbit_hooks_provider = injector.get(AbstractRabbitHooks) ?? throw_native_error('No provider for AbstractRabbitHooks')
        const session = RabbitConsumeSession.create(injector)
        const param_deps = get_providers(unit, injector, EXCEPT_TOKEN_SET)

        this.sessions.add(session)

        const on_message = async function(msg: ConsumeMessage | null): Promise<void> {

            const hooks = rabbit_hooks_provider.create()

            if (!msg) {
                throw new Error('Channel closed by server.')
            }

            let content = ''
            let handle_result: any

            async function handle(msg: ConsumeMessage) {

                await hooks.on_init(msg)

                content = await message_reader.read(msg)

                return unit.handler(...param_deps.map(({ provider, token }, index) => {
                    if (provider) {
                        return provider.create([{ token: `${unit.cls.name}.${unit.prop.toString()}`, index }])
                    }
                    switch (token) {
                        case TextMessage:
                            return new TextMessage(content, msg.fields, msg.properties)
                        case JsonMessage:
                            return new JsonMessage(content, msg.fields, msg.properties)
                        default:
                            return undefined
                    }
                })).then(() => ack_message())
            }

            try {
                await handle(msg)
            } catch (reason) {
                if (reason instanceof Ack || reason instanceof MessageError) {
                    handle_result = reason
                } else {
                    handle_result = new MessageDead({ code: 500, msg: 'Internal Server Error', origin: reason })
                }
            }

            if (handle_result instanceof Ack) {
                await hooks.on_ack(msg, content)
                session.ack(msg)
            } else if (handle_result instanceof MessageRequeue) {
                await hooks.on_requeue(msg, content, handle_result)
                session.requeue(msg)
            } else if (handle_result instanceof MessageDead) {
                await hooks.on_dead(msg, content, handle_result)
                session.kill(msg)
            }
        }

        session.consume(unit.queue, msg => on_message(msg).catch(e => console.log('catch', e)), unit.options)
    }
}
