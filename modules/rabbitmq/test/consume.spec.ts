/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Platform, TpInspector, TpService } from '@tarpit/core'
import amqplib, { Connection } from 'amqplib'
import chai, { expect } from 'chai'
import chai_spies from 'chai-spies'
import crypto from 'crypto'
import { Ack, ack_message, Consume, kill_message, MessageDead, MessageRequeue, RabbitDefine, RabbitDefineToken, RabbitMessage, RabbitmqModule, requeue_message, TpConsumer } from '../src'

chai.use(chai_spies)

const predefined_message: string[] = []

for (let i = 0; i < 50; i++) {
    predefined_message.push(crypto.randomUUID())
}

describe('consume case', function() {

    this.slow(200)

    let spy_ack: (...args: any[]) => void = chai.spy()
    let spy_requeue: (...args: any[]) => void = chai.spy()
    let spy_kill: (...args: any[]) => void = chai.spy()
    let spy_normal: (...args: any[]) => void = chai.spy()

    const D = new RabbitDefine()
        .define_queue('tarpit.queue.ack')
        .define_queue('tarpit.queue.ack.native')
        .define_queue('tarpit.queue.requeue')
        .define_queue('tarpit.queue.requeue.native')
        .define_queue('tarpit.queue.kill')
        .define_queue('tarpit.queue.kill.native')
        .define_queue('tarpit.queue.normal')

    @TpService()
    class TempService {

    }

    @TpConsumer({
        providers: [
            TempService,
            { provide: RabbitDefineToken, useValue: D, multi: true, root: true }
        ]
    })
    class TempConsumer {

        @Consume(D.Q['tarpit.queue.ack'], { prefetch: 10 })
        async consume_ack(_service: TempService) {
            spy_ack('normal')
            ack_message()
        }

        @Consume(D.Q['tarpit.queue.ack.native'], { prefetch: 10 })
        async consume_ack_native(_service: TempService) {
            spy_ack('native')
            throw new Ack()
        }

        @Consume(D.Q['tarpit.queue.requeue'])
        async consume_requeue(msg: RabbitMessage<any>) {
            spy_requeue('normal')
            msg.fields.redelivered || requeue_message()
        }

        @Consume(D.Q['tarpit.queue.requeue.native'])
        async consume_requeue_native(msg: RabbitMessage<any>) {
            spy_requeue('native')
            if (!msg.fields.redelivered) {
                throw new MessageRequeue({ code: 'Requeue', msg: 'some message' })
            }
        }

        @Consume(D.Q['tarpit.queue.kill'])
        async consume_kill() {
            spy_kill('normal')
            kill_message()
        }

        @Consume(D.Q['tarpit.queue.kill.native'])
        async consume_kill_native() {
            spy_kill('native')
            throw new MessageDead({ code: 'Dead', msg: 'some message' })
        }

        @Consume(D.Q['tarpit.queue.normal'])
        async consume_normal() {
            spy_normal()
            throw new Error('normal error')
        }
    }

    const url = process.env.RABBITMQ_URL ?? ''
    let connection: Connection
    let platform: Platform
    let inspector: TpInspector
    let consumer: TempConsumer

    const tmp = console.log
    before(async function() {
        console.log = () => undefined
        connection = await amqplib.connect(url)
        platform = new Platform({ rabbitmq: { url, prefetch: 10 } })
            .import(RabbitmqModule)
            .import(TempConsumer)

        inspector = platform.expose(TpInspector)!
        consumer = platform.expose(TempConsumer)!
        // const injector = platform.expose(Injector)!
        // injector.on('channel-error', err => console.log('channel-error', err))
        platform.start()
        await inspector.wait_start()

    })

    after(async function() {
        platform.terminate()
        await inspector.wait_terminate()
        const channel = await connection.createChannel()
        await channel.deleteQueue(D.Q['tarpit.queue.ack'], { ifEmpty: false, ifUnused: false })
        await channel.deleteQueue(D.Q['tarpit.queue.ack.native'], { ifEmpty: false, ifUnused: false })
        await channel.deleteQueue(D.Q['tarpit.queue.requeue'], { ifEmpty: false, ifUnused: false })
        await channel.deleteQueue(D.Q['tarpit.queue.requeue.native'], { ifEmpty: false, ifUnused: false })
        await channel.deleteQueue(D.Q['tarpit.queue.kill'], { ifEmpty: false, ifUnused: false })
        await channel.deleteQueue(D.Q['tarpit.queue.kill.native'], { ifEmpty: false, ifUnused: false })
        await channel.close()
        await connection.close()
        console.log = tmp
    })

    it('should ack message call ack_message', async function() {
        const channel = await connection.createChannel()
        channel.sendToQueue(D.Q['tarpit.queue.ack'], Buffer.from(JSON.stringify({ a: 1, b: 'c' })))
        await new Promise(resolve => setTimeout(resolve, 100))
        await channel.close()
        expect(spy_ack).to.have.been.first.called.with('normal')
    })

    it('should ack message by throw directly', async function() {
        const channel = await connection.createChannel()
        channel.sendToQueue(D.Q['tarpit.queue.ack.native'], Buffer.from(JSON.stringify({ a: 1, b: 'c' })))
        await new Promise(resolve => setTimeout(resolve, 100))
        await channel.close()
        expect(spy_ack).to.have.been.second.called.with('native')
    })

    it('should kill message', async function() {
        const channel = await connection.createChannel()
        channel.sendToQueue(D.Q['tarpit.queue.kill'], Buffer.from(JSON.stringify({ a: 1, b: 'c' })))
        await new Promise(resolve => setTimeout(resolve, 50))
        await channel.close()
        expect(spy_kill).to.have.been.first.called.with('normal')
    })

    it('should kill message', async function() {
        const channel = await connection.createChannel()
        channel.sendToQueue(D.Q['tarpit.queue.kill.native'], Buffer.from(JSON.stringify({ a: 1, b: 'c' })))
        await new Promise(resolve => setTimeout(resolve, 50))
        await channel.close()
        expect(spy_kill).to.have.been.second.called.with('native')
    })

    it('should requeue message', async function() {
        const channel = await connection.createChannel()
        channel.sendToQueue(D.Q['tarpit.queue.requeue'], Buffer.from(JSON.stringify({ a: 1, b: 'c' })))
        await new Promise(resolve => setTimeout(resolve, 50))
        await channel.close()
        expect(spy_requeue).to.have.been.first.called.with('normal')
        expect(spy_requeue).to.have.been.second.called.with('normal')
    })

    it('should requeue message', async function() {
        const channel = await connection.createChannel()
        channel.sendToQueue(D.Q['tarpit.queue.requeue.native'], Buffer.from(JSON.stringify({ a: 1, b: 'c' })))
        await new Promise(resolve => setTimeout(resolve, 50))
        await channel.close()
        expect(spy_requeue).to.have.been.third.called.with('native')
        expect(spy_requeue).to.have.been.nth(4).called.with('native')
    })

    it('should kill message if unknown error thrown by consumer', async function() {
        const channel = await connection.createChannel()
        channel.sendToQueue(D.Q['tarpit.queue.normal'], Buffer.from(JSON.stringify({ a: 1, b: 'c' })))
        await new Promise(resolve => setTimeout(resolve, 50))
        await channel.close()
        expect(spy_normal).to.have.been.called.once
    })
})
