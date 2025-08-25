/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpModule } from '@tarpit/core'
import amqplib, { Connection, GetMessage } from 'amqplib'
import crypto from 'node:crypto'
import timers from 'node:timers/promises'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfirmProducer, Consume, Enqueue, Producer, Publish, RabbitDefine, RabbitDefineToken, RabbitMessage, RabbitmqModule, TpConsumer, TpProducer } from '../src'

const consume_result: string[] = []
const predefined_message: string[] = []
for (let i = 0; i < 50; i++) {
    predefined_message.push(crypto.randomUUID())
}

const D = new RabbitDefine()
    .define_exchange('tarpit.exchange.normal.confirm', 'topic')
    .define_exchange('tarpit.exchange.normal.normal', 'topic')
    .define_queue('tarpit.queue.normal.confirm')
    .define_queue('tarpit.queue.normal.normal')
    .define_queue('tarpit.queue.normal.direct')
    .define_queue('tarpit.queue.normal.predefined')
    .define_queue('tarpit.queue.normal.predefined.confirm')
    .bind_queue('tarpit.exchange.normal.normal', 'tarpit.queue.normal.normal', 'normal')
    .bind_queue('tarpit.exchange.normal.confirm', 'tarpit.queue.normal.confirm', 'confirm')

@TpProducer({})
class TempProducer {

    @Publish(D.X['tarpit.exchange.normal.normal'], 'normal')
    publish_normal!: Producer<string>

    @Publish(D.X['tarpit.exchange.normal.confirm'], 'confirm')
    publish_confirm!: ConfirmProducer<string>

    @Enqueue(D.Q['tarpit.queue.normal.normal'])
    enqueue_normal!: Producer<string>

    @Enqueue(D.Q['tarpit.queue.normal.confirm'])
    enqueue_confirm!: ConfirmProducer<string>

    @Enqueue(D.Q['tarpit.queue.normal.predefined'])
    enqueue_predefined!: Producer<string>

    @Enqueue(D.Q['tarpit.queue.normal.predefined.confirm'])
    enqueue_predefined_confirm!: ConfirmProducer<string>
}

@TpConsumer({
    providers: [{ provide: RabbitDefineToken, useValue: D, multi: true, root: true }]
})
class TempConsumer {

    @Consume(D.Q['tarpit.queue.normal.predefined'])
    async consume_predefine(msg: RabbitMessage<any>) {
        consume_result.push(msg.text ?? '')
    }
}

@TpModule({
    imports: [TempProducer, TempConsumer]
})
class TempModule {

    constructor(
        private producer: TempProducer
    ) {
        for (const msg of predefined_message) {
            this.producer.enqueue_predefined.send(msg, {})
        }
        this.producer.enqueue_predefined_confirm.send('enqueue_predefined_confirm', {}).then()
    }
}

describe('normal case', () => {

    const rabbitmq_url = process.env.RABBITMQ_URL!
    let connection: Connection
    let platform: Platform
    let producer: TempProducer

    beforeEach(async () => {
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        vi.spyOn(console, 'log').mockImplementation(() => undefined)
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        connection = await amqplib.connect(rabbitmq_url)
        platform = new Platform(load_config<TpConfigSchema>({ rabbitmq: { url: rabbitmq_url } }))
            .import(RabbitmqModule)
            .import(TempModule)

        await platform.start()
        producer = platform.expose(TempProducer)!
        await timers.setTimeout(200)
    })

    afterEach(async () => {
        await platform.terminate()
        const channel = await connection.createChannel()
        await channel.deleteExchange(D.X['tarpit.exchange.normal.confirm'], { ifUnused: false })
        await channel.deleteExchange(D.X['tarpit.exchange.normal.normal'], { ifUnused: false })
        await channel.deleteQueue(D.Q['tarpit.queue.normal.normal'], { ifUnused: false, ifEmpty: false })
        await channel.deleteQueue(D.Q['tarpit.queue.normal.direct'], { ifUnused: false, ifEmpty: false })
        await channel.deleteQueue(D.Q['tarpit.queue.normal.confirm'], { ifUnused: false, ifEmpty: false })
        await channel.deleteQueue(D.Q['tarpit.queue.normal.predefined'], { ifUnused: false, ifEmpty: false })
        await channel.deleteQueue(D.Q['tarpit.queue.normal.predefined.confirm'], { ifUnused: false, ifEmpty: false })
        await channel.close()
        await connection.close()
        vi.restoreAllMocks()
    })

    it('should consume predefine message', async () => {
        await timers.setTimeout(200)
        expect(consume_result.length).equal(predefined_message.length)
        expect(consume_result).toEqual(predefined_message)
    })

    it('should publish message to exchange', async () => {
        producer.publish_normal.send('publish_normal')
        // await timers.setTimeout(100)
        const channel = await connection.createChannel()
        const msg = await channel.get(D.Q['tarpit.queue.normal.normal'], { noAck: true })
        expect(msg).not.equal(false)
        expect((msg as GetMessage).content.toString()).equal('publish_normal')
        await channel.close()
    })

    it('should publish message to exchange with confirm', async () => {
        await producer.publish_confirm.send('publish_confirm')
        const channel = await connection.createChannel()
        const msg = await channel.get(D.Q['tarpit.queue.normal.confirm'], { noAck: true })
        expect(msg).not.equal(false)
        expect((msg as GetMessage).content.toString()).equal('publish_confirm')
        await channel.close()
    })

    it('should send message to queue', async () => {
        producer.enqueue_normal.send('enqueue_normal')
        // await timers.setTimeout(50)
        const channel = await connection.createChannel()
        const msg = await channel.get(D.Q['tarpit.queue.normal.normal'], { noAck: true })
        expect(msg).not.equal(false)
        expect((msg as GetMessage).content.toString()).equal('enqueue_normal')
        await channel.close()
    })

    it('should send message to queue with confirm', async () => {
        await producer.enqueue_confirm.send('enqueue_confirm')
        const channel = await connection.createChannel()
        const msg = await channel.get(D.Q['tarpit.queue.normal.confirm'], { noAck: true })
        expect(msg).not.equal(false)
        expect((msg as GetMessage).content.toString()).equal('enqueue_confirm')
        await channel.close()
    })
})
