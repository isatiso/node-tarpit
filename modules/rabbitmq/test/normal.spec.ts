/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpRoot } from '@tarpit/core'
import amqplib, { Connection, GetMessage } from 'amqplib'
import chai, { expect } from 'chai'
import chai_spies from 'chai-spies'
import crypto from 'crypto'
import { ConfirmProducer, Consume, Enqueue, Producer, Publish, RabbitDefine, RabbitDefineToken, RabbitMessage, RabbitmqModule, TpConsumer, TpProducer } from '../src'

chai.use(chai_spies)

const consume_result: string[] = []
const predefined_message: string[] = []

for (let i = 0; i < 50; i++) {
    predefined_message.push(crypto.randomUUID())
}

const D = new RabbitDefine()
    .define_exchange('tarpit.exchange.confirm', 'topic')
    .define_exchange('tarpit.exchange.normal', 'topic')
    .define_queue('tarpit.queue.confirm')
    .define_queue('tarpit.queue.normal')
    .define_queue('tarpit.queue.direct')
    .define_queue('tarpit.queue.predefined')
    .define_queue('tarpit.queue.predefined.confirm')
    .bind_queue('tarpit.exchange.normal', 'tarpit.queue.normal', 'normal')
    .bind_queue('tarpit.exchange.confirm', 'tarpit.queue.confirm', 'confirm')

@TpProducer({})
class TempProducer {

    @Publish(D.X['tarpit.exchange.normal'], 'normal')
    publish_normal!: Producer<string>

    @Publish(D.X['tarpit.exchange.confirm'], 'confirm')
    publish_confirm!: ConfirmProducer<string>

    @Enqueue(D.Q['tarpit.queue.normal'])
    enqueue_normal!: Producer<string>

    @Enqueue(D.Q['tarpit.queue.confirm'])
    enqueue_confirm!: ConfirmProducer<string>

    @Enqueue(D.Q['tarpit.queue.predefined'])
    enqueue_predefined!: Producer<string>

    @Enqueue(D.Q['tarpit.queue.predefined.confirm'])
    enqueue_predefined_confirm!: ConfirmProducer<string>
}

@TpConsumer({
    providers: [{ provide: RabbitDefineToken, useValue: D, multi: true, root: true }]
})
class TempConsumer {

    @Consume(D.Q['tarpit.queue.predefined'])
    async consume_predefine(msg: RabbitMessage<any>) {
        consume_result.push(msg.text ?? '')
    }
}

@TpRoot({
    imports: [TempProducer, TempConsumer]
})
class TempRoot {

    constructor(
        private producer: TempProducer
    ) {
        for (const msg of predefined_message) {
            this.producer.enqueue_predefined.send(msg, {})
        }
        this.producer.enqueue_predefined_confirm.send('enqueue_predefined_confirm', {}).then()
    }
}

describe('normal case', function() {

    this.slow(200)

    const url = process.env.RABBITMQ_URL ?? ''
    let connection: Connection
    let platform: Platform
    let producer: TempProducer
    const sandbox = chai.spy.sandbox()

    before(async function() {
        sandbox.on(console, ['debug', 'log', 'info', 'warn', 'error'], () => undefined)
        connection = await amqplib.connect(url)
        platform = new Platform(load_config<TpConfigSchema>({ rabbitmq: { url } }))
            .import(RabbitmqModule)
            .import(TempRoot)

        await platform.start()
        producer = platform.expose(TempProducer)!
        await new Promise(resolve => setTimeout(resolve, 200))
    })

    after(async function() {
        await platform.terminate()
        const channel = await connection.createChannel()
        await channel.deleteExchange(D.X['tarpit.exchange.confirm'], { ifUnused: false })
        await channel.deleteExchange(D.X['tarpit.exchange.normal'], { ifUnused: false })
        await channel.deleteQueue(D.Q['tarpit.queue.normal'], { ifUnused: false, ifEmpty: false })
        await channel.deleteQueue(D.Q['tarpit.queue.direct'], { ifUnused: false, ifEmpty: false })
        await channel.deleteQueue(D.Q['tarpit.queue.confirm'], { ifUnused: false, ifEmpty: false })
        await channel.deleteQueue(D.Q['tarpit.queue.predefined'], { ifUnused: false, ifEmpty: false })
        await channel.deleteQueue(D.Q['tarpit.queue.predefined.confirm'], { ifUnused: false, ifEmpty: false })
        await channel.close()
        await connection.close()
        sandbox.restore()
    })

    it('should consume predefine message', async function() {
        await new Promise(resolve => setTimeout(resolve, 200))
        expect(consume_result.length).to.equal(predefined_message.length)
        expect(consume_result).to.eql(predefined_message)
    })

    it('should publish message to exchange', async function() {
        producer.publish_normal.send('publish_normal')
        await new Promise(resolve => setTimeout(resolve, 100))
        const channel = await connection.createChannel()
        const msg = await channel.get(D.Q['tarpit.queue.normal'], { noAck: true })
        expect(msg).to.not.equal(false)
        expect((msg as GetMessage).content.toString()).to.equal('publish_normal')
        await channel.close()
    })

    it('should publish message to exchange with confirm', async function() {
        await producer.publish_confirm.send('publish_confirm')
        const channel = await connection.createChannel()
        const msg = await channel.get(D.Q['tarpit.queue.confirm'], { noAck: true })
        expect(msg).to.not.equal(false)
        expect((msg as GetMessage).content.toString()).to.equal('publish_confirm')
        await channel.close()
    })

    it('should send message to queue', async function() {
        producer.enqueue_normal.send('enqueue_normal')
        await new Promise(resolve => setTimeout(resolve, 50))
        const channel = await connection.createChannel()
        const msg = await channel.get(D.Q['tarpit.queue.normal'], { noAck: true })
        expect(msg).to.not.equal(false)
        expect((msg as GetMessage).content.toString()).to.equal('enqueue_normal')
        await channel.close()
    })

    it('should send message to queue with confirm', async function() {
        await producer.enqueue_confirm.send('enqueue_confirm')
        const channel = await connection.createChannel()
        const msg = await channel.get(D.Q['tarpit.queue.confirm'], { noAck: true })
        expect(msg).to.not.equal(false)
        expect((msg as GetMessage).content.toString()).to.equal('enqueue_confirm')
        await channel.close()
    })
})
