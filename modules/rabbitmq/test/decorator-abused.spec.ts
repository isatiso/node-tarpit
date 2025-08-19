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
import chai, { expect } from 'chai'
import chai_as_promised from 'chai-as-promised'
import { ConfirmProducer, Enqueue, Publish, RabbitDefine, RabbitDefineToken, RabbitmqModule, TpProducer } from '../src'
import { rabbitmq_url } from './helpers/test-helper'

chai.use(chai_as_promised)

describe('decorator abused case', function() {

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

    const sandbox = chai.spy.sandbox()

    before(async function() {
        sandbox.on(console, ['debug', 'log', 'info', 'warn', 'error'], () => undefined)
        connection = await amqplib.connect(rabbitmq_url)
        platform = new Platform(load_config<TpConfigSchema>({ rabbitmq: { url: rabbitmq_url } }))
            .import({ provide: RabbitDefineToken, useValue: D, multi: true, root: true })
            .import(RabbitmqModule)
            .import(TempProducer)

        await platform.start()
        producer = platform.expose(TempProducer)!
        await new Promise(resolve => setTimeout(resolve, 200))
    })

    after(async function() {
        await platform.terminate()
        const channel = await connection.createChannel()
        await channel.deleteExchange(D.X['tarpit.exchange.abused.a'], { ifUnused: false })
        await channel.deleteExchange(D.X['tarpit.exchange.abused.b'], { ifUnused: false })
        await channel.deleteQueue(D.Q['tarpit.queue.abused.a'], { ifUnused: false, ifEmpty: false })
        await channel.deleteQueue(D.Q['tarpit.queue.abused.b'], { ifUnused: false, ifEmpty: false })
        await channel.close()
        await connection.close()
        sandbox.restore()
    })

    it('should reject cached promise with error', async function() {
        await producer.seized_publish.send('seized_publish')
        await new Promise(resolve => setTimeout(resolve, 50))
        const channel = await connection.createChannel()
        const msg_a = await channel.get(D.Q['tarpit.queue.abused.a'], { noAck: true })
        const msg_b = await channel.get(D.Q['tarpit.queue.abused.b'], { noAck: true })
        expect(msg_a).not.to.equal(false)
        expect(msg_b).to.be.false
        expect((msg_a as GetMessage).content.toString()).to.equal('seized_publish')
        await channel.close()
    })

    it('should reject directly call with error', async function() {
        await producer.seized_enqueue.send('seized_enqueue')
        await new Promise(resolve => setTimeout(resolve, 50))
        const channel = await connection.createChannel()
        const msg_a = await channel.get(D.Q['tarpit.queue.abused.a'], { noAck: true })
        const msg_b = await channel.get(D.Q['tarpit.queue.abused.b'], { noAck: true })
        expect(msg_a).to.be.false
        expect(msg_b).not.to.equal(false)
        expect((msg_b as GetMessage).content.toString()).to.equal('seized_enqueue')
        await channel.close()
    })
})
