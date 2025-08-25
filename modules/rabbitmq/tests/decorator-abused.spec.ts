/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema } from '@tarpit/core'
import amqplib, { Connection, GetMessage } from 'amqplib'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { ConfirmProducer, Enqueue, Publish, RabbitDefine, RabbitDefineToken, RabbitmqModule, TpProducer } from '../src'

describe('decorator abused case', () => {

    const rabbitmq_url = process.env.RABBITMQ_URL!

    const D = new RabbitDefine()
        .define_exchange('tarpit.exchange.abused.a', 'topic')
        .define_exchange('tarpit.exchange.abused.b', 'topic')
        .define_queue('tarpit.queue.abused.a')
        .define_queue('tarpit.queue.abused.b')
        .bind_queue('tarpit.exchange.abused.a', 'tarpit.queue.abused.a', 'a')

    @TpProducer({})
    class TempProducer {

        @Enqueue(D.Q['tarpit.queue.abused.b'])
        @Publish(D.X['tarpit.exchange.abused.a'], 'a')
        seized_publish!: ConfirmProducer<string>

        @Publish(D.X['tarpit.exchange.abused.a'], 'a')
        @Enqueue(D.Q['tarpit.queue.abused.b'])
        seized_enqueue!: ConfirmProducer<string>
    }

    let connection: Connection
    let platform: Platform
    let producer: TempProducer

    beforeAll(async () => {
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        vi.spyOn(console, 'log').mockImplementation(() => undefined)
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        connection = await amqplib.connect(rabbitmq_url)
        platform = new Platform(load_config<TpConfigSchema>({ rabbitmq: { url: rabbitmq_url } }))
            .import({ provide: RabbitDefineToken, useValue: D, multi: true, root: true })
            .import(RabbitmqModule)
            .import(TempProducer)

        await platform.start()
        producer = platform.expose(TempProducer)!
        await new Promise(resolve => setTimeout(resolve, 200))
    })

    afterAll(async () => {
        await platform.terminate()
        const channel = await connection.createChannel()
        await channel.deleteExchange(D.X['tarpit.exchange.abused.a'], { ifUnused: false })
        await channel.deleteExchange(D.X['tarpit.exchange.abused.b'], { ifUnused: false })
        await channel.deleteQueue(D.Q['tarpit.queue.abused.a'], { ifUnused: false, ifEmpty: false })
        await channel.deleteQueue(D.Q['tarpit.queue.abused.b'], { ifUnused: false, ifEmpty: false })
        await channel.close()
        await connection.close()
        vi.restoreAllMocks()
    })

    it('should reject cached promise with error', async () => {
        await producer.seized_publish.send('seized_publish')
        await new Promise(resolve => setTimeout(resolve, 50))
        const channel = await connection.createChannel()
        const msg_a = await channel.get(D.Q['tarpit.queue.abused.a'], { noAck: true })
        const msg_b = await channel.get(D.Q['tarpit.queue.abused.b'], { noAck: true })
        expect(msg_a).not.equal(false)
        expect(msg_b).toBe(false)
        expect((msg_a as GetMessage).content.toString()).equal('seized_publish')
        await channel.close()
    })

    it('should reject directly call with error', async () => {
        await producer.seized_enqueue.send('seized_enqueue')
        await new Promise(resolve => setTimeout(resolve, 50))
        const channel = await connection.createChannel()
        const msg_a = await channel.get(D.Q['tarpit.queue.abused.a'], { noAck: true })
        const msg_b = await channel.get(D.Q['tarpit.queue.abused.b'], { noAck: true })
        expect(msg_a).toBe(false)
        expect(msg_b).not.equal(false)
        expect((msg_b as GetMessage).content.toString()).equal('seized_enqueue')
        await channel.close()
    })
})