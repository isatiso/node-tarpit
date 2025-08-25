/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema } from '@tarpit/core'
import amqplib, { Connection } from 'amqplib'
import { takeUntil } from 'rxjs'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { ConfirmProducer, Enqueue, Producer, Publish, RabbitDefine, RabbitDefineToken, RabbitmqModule, TpProducer } from '../src'
import { RabbitNotifier } from '../src/services/rabbit-notifier'

const D = new RabbitDefine()
    .define_exchange('tarpit.exchange.bench.confirm', 'topic')
    .define_exchange('tarpit.exchange.bench.normal', 'topic')
    .define_queue('tarpit.queue.bench.confirm')
    .define_queue('tarpit.queue.bench.normal')
    .bind_queue('tarpit.exchange.bench.confirm', 'tarpit.queue.bench.confirm', 'confirm')
    .bind_queue('tarpit.exchange.bench.normal', 'tarpit.queue.bench.normal', 'normal')

@TpProducer({
    providers: [
        { provide: RabbitDefineToken, useValue: D, multi: true, root: true }
    ]
})
class TempProducer {

    @Publish(D.X['tarpit.exchange.bench.normal'], 'normal')
    publish_normal!: Producer<Buffer>

    @Publish(D.X['tarpit.exchange.bench.confirm'], 'confirm')
    publish_confirm!: ConfirmProducer<Buffer>

    @Enqueue(D.Q['tarpit.queue.bench.normal'])
    enqueue_normal!: Producer<Buffer>

    @Enqueue(D.Q['tarpit.queue.bench.confirm'])
    enqueue_confirm!: ConfirmProducer<Buffer>
}

describe('produce drain case', () => {

    const rabbitmq_url = process.env.RABBITMQ_URL!
    const buf = Buffer.from(`Stops the server from accepting new connections and keeps existing connections. This function is asynchronous, the server is finally closed when all connections are ended and the server emits a 'close' event. The optional callback will be called once the 'close' event occurs. Unlike that event, it will be called with an Error as its only argument if the server was not open when it was closed.`)
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
            .import(RabbitmqModule)
            .import(TempProducer)

        const notifier = platform.expose(RabbitNotifier)!
        notifier.channel_error$.pipe(takeUntil(notifier.off$)).subscribe(err => console.error('channel-error', err))
        notifier.on('error', err => console.error('error', err))
        await platform.start()
        producer = platform.expose(TempProducer)!
        await new Promise(resolve => setTimeout(resolve, 200))
    })

    afterAll(async () => {
        await new Promise(resolve => setTimeout(resolve, 2000))
        await platform.terminate()
        const channel = await connection.createChannel()
        await channel.deleteExchange(D.X['tarpit.exchange.bench.confirm'], { ifUnused: false })
        await channel.deleteExchange(D.X['tarpit.exchange.bench.normal'], { ifUnused: false })
        await channel.deleteQueue(D.Q['tarpit.queue.bench.normal'], { ifUnused: false, ifEmpty: false })
        await channel.deleteQueue(D.Q['tarpit.queue.bench.confirm'], { ifUnused: false, ifEmpty: false })
        await channel.close()
        await connection.close()
        vi.restoreAllMocks()
    })

    it('should flush on drain[publish to channel]', async () => {
        for (let i = 0; i < 5000; i++) {
            producer.publish_normal.send(buf)
        }
        await new Promise(resolve => setTimeout(resolve, 1000))
        const channel = await connection.createChannel()
        const res = await channel.checkQueue(D.Q['tarpit.queue.bench.normal'])
        expect(res.messageCount).equal(5000)
        await channel.close()
    })

    it('should flush on drain[publish to confirmedChannel]', async () => {
        const promises: Promise<any>[] = []
        for (let i = 0; i < 5000; i++) {
            promises.push(producer.publish_confirm.send(buf))
        }
        await Promise.all(promises)
        const channel = await connection.createChannel()
        const res = await channel.checkQueue(D.Q['tarpit.queue.bench.confirm'])
        expect(res.messageCount).equal(5000)
        await channel.close()
    })

    it('should flush on drain[enqueue]', async () => {
        for (let i = 0; i < 5000; i++) {
            producer.enqueue_normal.send(buf)
        }
        await new Promise(resolve => setTimeout(resolve, 1000))
        const channel = await connection.createChannel()
        const res = await channel.checkQueue(D.Q['tarpit.queue.bench.normal'])
        expect(res.messageCount).equal(10000)
        await channel.close()
    })

    it('should flush on drain[confirmed enqueue]', async () => {
        const promises: Promise<any>[] = []
        for (let i = 0; i < 5000; i++) {
            promises.push(producer.enqueue_confirm.send(buf))
        }
        await Promise.all(promises)
        const channel = await connection.createChannel()
        const res = await channel.checkQueue(D.Q['tarpit.queue.bench.confirm'])
        expect(res.messageCount).equal(10000)
        await channel.close()
    })
})