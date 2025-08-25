/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'
import amqplib, { Connection } from 'amqplib'
import crypto from 'crypto'
import * as timers from 'node:timers/promises'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { Ack, ack_message, Consume, kill_message, MessageDead, MessageRequeue, RabbitDefine, RabbitDefineToken, RabbitMessage, RabbitmqModule, requeue_message, TpConsumer } from '../src'

const predefined_message: string[] = []
for (let i = 0; i < 50; i++) {
    predefined_message.push(crypto.randomUUID())
}

describe('consume case', () => {

    const rabbitmq_url = process.env.RABBITMQ_URL!
    const spy_ack = vi.fn()
    const spy_requeue = vi.fn()
    const spy_kill = vi.fn()
    const spy_normal = vi.fn()

    const D = new RabbitDefine()
        .define_queue('tarpit.queue.consume.ack')
        .define_queue('tarpit.queue.consume.ack.native')
        .define_queue('tarpit.queue.consume.requeue')
        .define_queue('tarpit.queue.consume.requeue.native')
        .define_queue('tarpit.queue.consume.kill')
        .define_queue('tarpit.queue.consume.kill.native')
        .define_queue('tarpit.queue.consume.normal')

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

        @Consume(D.Q['tarpit.queue.consume.ack'], { prefetch: 10 })
        async consume_ack(_service: TempService) {
            spy_ack('normal')
            ack_message()
        }

        @Consume(D.Q['tarpit.queue.consume.ack.native'], { prefetch: 10 })
        async consume_ack_native(_service: TempService) {
            spy_ack('native')
            throw new Ack()
        }

        @Consume(D.Q['tarpit.queue.consume.requeue'])
        async consume_requeue(msg: RabbitMessage<any>) {
            spy_requeue('normal')
            msg.fields.redelivered || requeue_message()
        }

        @Consume(D.Q['tarpit.queue.consume.requeue.native'])
        async consume_requeue_native(msg: RabbitMessage<any>) {
            spy_requeue('native')
            if (!msg.fields.redelivered) {
                throw new MessageRequeue({ code: 'Requeue', msg: 'some message' })
            }
        }

        @Consume(D.Q['tarpit.queue.consume.kill'])
        async consume_kill() {
            spy_kill('normal')
            kill_message()
        }

        @Consume(D.Q['tarpit.queue.consume.kill.native'])
        async consume_kill_native() {
            spy_kill('native')
            throw new MessageDead({ code: 'Dead', msg: 'some message' })
        }

        @Consume(D.Q['tarpit.queue.consume.normal'])
        async consume_normal() {
            spy_normal()
            throw new Error('normal error')
        }
    }

    let connection: Connection
    let platform: Platform

    beforeAll(async () => {
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        vi.spyOn(console, 'log').mockImplementation(() => undefined)
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        connection = await amqplib.connect(rabbitmq_url)
        platform = new Platform(load_config<TpConfigSchema>({ rabbitmq: { url: rabbitmq_url, prefetch: 10 } }))
            .import(RabbitmqModule)
            .import(TempConsumer)
        await platform.start()
    })

    afterAll(async () => {
        await platform.terminate()
        const channel = await connection.createChannel()
        await channel.deleteQueue(D.Q['tarpit.queue.consume.ack'], { ifEmpty: false, ifUnused: false })
        await channel.deleteQueue(D.Q['tarpit.queue.consume.ack.native'], { ifEmpty: false, ifUnused: false })
        await channel.deleteQueue(D.Q['tarpit.queue.consume.requeue'], { ifEmpty: false, ifUnused: false })
        await channel.deleteQueue(D.Q['tarpit.queue.consume.requeue.native'], { ifEmpty: false, ifUnused: false })
        await channel.deleteQueue(D.Q['tarpit.queue.consume.normal'], { ifEmpty: false, ifUnused: false })
        await channel.deleteQueue(D.Q['tarpit.queue.consume.kill'], { ifEmpty: false, ifUnused: false })
        await channel.deleteQueue(D.Q['tarpit.queue.consume.kill.native'], { ifEmpty: false, ifUnused: false })
        await channel.close()
        await connection.close()
        vi.restoreAllMocks()
    })

    it('should ack message call ack_message', async () => {
        const channel = await connection.createChannel()
        channel.sendToQueue(D.Q['tarpit.queue.consume.ack'], Buffer.from(JSON.stringify({ a: 1, b: 'c' })))
        await timers.setTimeout(100)
        await channel.close()
        expect(spy_ack).toHaveBeenNthCalledWith(1, 'normal')
    })

    it('should ack message by throw directly', async () => {
        const channel = await connection.createChannel()
        channel.sendToQueue(D.Q['tarpit.queue.consume.ack.native'], Buffer.from(JSON.stringify({ a: 1, b: 'c' })))
        await timers.setTimeout(100)
        await channel.close()
        expect(spy_ack).toHaveBeenNthCalledWith(2, 'native')
    })

    it('should kill message', async () => {
        const channel = await connection.createChannel()
        channel.sendToQueue(D.Q['tarpit.queue.consume.kill'], Buffer.from(JSON.stringify({ a: 1, b: 'c' })))
        await timers.setTimeout(50)
        await channel.close()
        expect(spy_kill).toHaveBeenNthCalledWith(1, 'normal')
    })

    it('should kill message', async () => {
        const channel = await connection.createChannel()
        channel.sendToQueue(D.Q['tarpit.queue.consume.kill.native'], Buffer.from(JSON.stringify({ a: 1, b: 'c' })))
        await timers.setTimeout(50)
        await channel.close()
        expect(spy_kill).toHaveBeenNthCalledWith(2, 'native')
    })

    it('should requeue message', async () => {
        const channel = await connection.createChannel()
        channel.sendToQueue(D.Q['tarpit.queue.consume.requeue'], Buffer.from(JSON.stringify({ a: 1, b: 'c' })))
        await timers.setTimeout(50)
        await channel.close()
        expect(spy_requeue).toHaveBeenNthCalledWith(1, 'normal')
        expect(spy_requeue).toHaveBeenNthCalledWith(2, 'normal')
    })

    it('should requeue message', async () => {
        const channel = await connection.createChannel()
        channel.sendToQueue(D.Q['tarpit.queue.consume.requeue.native'], Buffer.from(JSON.stringify({ a: 1, b: 'c' })))
        await timers.setTimeout(50)
        await channel.close()
        expect(spy_requeue).toHaveBeenNthCalledWith(3, 'native')
        expect(spy_requeue).toHaveBeenNthCalledWith(4, 'native')
    })

    it('should kill message if unknown error thrown by consumer', async () => {
        const channel = await connection.createChannel()
        channel.sendToQueue(D.Q['tarpit.queue.consume.normal'], Buffer.from(JSON.stringify({ a: 1, b: 'c' })))
        await timers.setTimeout(50)
        await channel.close()
        expect(spy_normal).toHaveBeenCalledTimes(1)
    })
})
