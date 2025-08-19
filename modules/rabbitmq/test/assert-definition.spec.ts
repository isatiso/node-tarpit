/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema } from '@tarpit/core'
import { connect } from 'amqplib'
import chai, { expect } from 'chai'
import chai_spies from 'chai-spies'
import { RabbitDefine, RabbitDefineToken, RabbitmqModule } from '../src'
import { RabbitNotifier } from '../src/services/rabbit-notifier'
import { rabbitmq_url } from './helpers/test-helper'

chai.use(chai_spies)

describe('assert definition case', function() {

    this.slow(200)
    this.timeout(20000)

    const sandbox = chai.spy.sandbox()

    before(async function() {
        sandbox.on(console, ['debug', 'log', 'info', 'warn', 'error'], () => undefined)
    })

    after(async function() {
        const connection = await connect(rabbitmq_url)
        const channel = await connection.createChannel()
        await channel.deleteExchange('tarpit.exchange.a', { ifUnused: false })
        await channel.deleteExchange('tarpit.exchange.b', { ifUnused: false })
        await channel.deleteExchange('tarpit.exchange.c', { ifUnused: false })
        await channel.deleteQueue('tarpit.queue.a', { ifUnused: false, ifEmpty: false })
        await channel.deleteQueue('tarpit.queue.b', { ifUnused: false, ifEmpty: false })
        await channel.deleteQueue('tarpit.queue.c', { ifUnused: false, ifEmpty: false })
        await channel.close()
        await connection.close()
        sandbox.restore()
    })

    it('should assert definition as provide', async function() {

        const D = new RabbitDefine()
            .define_exchange('tarpit.exchange.a', 'topic')
            .define_exchange('tarpit.exchange.b', 'topic')
            .define_exchange('tarpit.exchange.c', 'topic')
            .define_queue('tarpit.queue.a')
            .define_queue('tarpit.queue.b')
            .define_queue('tarpit.queue.c')
            .bind_exchange('tarpit.exchange.a', 'tarpit.exchange.b', 'a-to-b')
            .bind_queue('tarpit.exchange.a', 'tarpit.queue.a', 'aa')
            .bind_queue('tarpit.exchange.b', 'tarpit.queue.b', 'bb')
            .bind_queue('tarpit.exchange.c', 'tarpit.queue.c', 'cc')

        const platform = new Platform(load_config<TpConfigSchema>({ rabbitmq: { url: rabbitmq_url } }))
            .import({ provide: RabbitDefineToken, useValue: D, multi: true, root: true })
            .import(RabbitmqModule)

        await platform.start()
        const connection = await connect(rabbitmq_url)
        const channel = await connection.createChannel()
        const [a, b, c, d, e, f] = await Promise.all([
            channel.checkExchange(D.X['tarpit.exchange.a']),
            channel.checkExchange(D.X['tarpit.exchange.b']),
            channel.checkExchange(D.X['tarpit.exchange.c']),
            channel.checkQueue(D.Q['tarpit.queue.a']),
            channel.checkQueue(D.Q['tarpit.queue.b']),
            channel.checkQueue(D.Q['tarpit.queue.c']),
        ])
        expect(a).to.eql({})
        expect(b).to.eql({})
        expect(c).to.eql({})
        expect(d).to.eql({ consumerCount: 0, messageCount: 0, queue: 'tarpit.queue.a' })
        expect(e).to.eql({ consumerCount: 0, messageCount: 0, queue: 'tarpit.queue.b' })
        expect(f).to.eql({ consumerCount: 0, messageCount: 0, queue: 'tarpit.queue.c' })
        await channel.close()
        await platform.terminate()

        await connection.close()
    })

    it('should throw error if definition conflicted', async function() {
        const D = new RabbitDefine().define_exchange('tarpit.exchange.a', 'direct', { durable: true })
        const platform = new Platform(load_config<TpConfigSchema>({ rabbitmq: { url: rabbitmq_url } }))
        platform.import({ provide: RabbitDefineToken, useValue: D, multi: true, root: true })
            .import(RabbitmqModule)

        const notifier = platform.expose(RabbitNotifier)!
        notifier.on('error', ({ type }) => {
            if (type === 'rabbitmq.connection.error' || type === 'rabbitmq.assert.definition.failed') {
                spy_on_error(type)
            }
        })
        const spy_on_error: (...args: any[]) => void = chai.spy()

        await platform.start()
        await platform.terminate()

        expect(spy_on_error).to.have.been.first.called.with('rabbitmq.connection.error')
        expect(spy_on_error).to.have.been.second.called.with('rabbitmq.assert.definition.failed')
    })

    it('should ignore key conflict on defining exchange', async function() {
        const D = new RabbitDefine().define_exchange('tarpit.exchange.a', 'direct')
        D.define_exchange('tarpit.exchange.a' as any, 'topic')
        expect(D.exchange_defines.length).to.equal(1)
        expect(D.exchange_defines[0][1]).to.equal('direct')
    })

    it('should ignore key conflict on defining queue', async function() {
        const D = new RabbitDefine().define_queue('tarpit.queue.a', { expires: 1000 })
        D.define_queue('tarpit.queue.a' as any, { expires: 500 })
        expect(D.queue_defines.length).to.equal(1)
        expect(D.queue_defines[0][1]).to.eql({ expires: 1000 })
    })

    it('should ignore key conflict on binding exchange', async function() {
        const D = new RabbitDefine()
            .define_exchange('tarpit.exchange.a', 'topic')
            .define_exchange('tarpit.exchange.b', 'topic')
            .bind_exchange('tarpit.exchange.a', 'tarpit.exchange.b', 'a2b')
        D.bind_exchange('tarpit.exchange.a', 'tarpit.exchange.b', 'a2b')
        expect(D.exchange_bindings.length).to.equal(1)
        expect(D.exchange_bindings[0]).to.eql(['tarpit.exchange.b', 'tarpit.exchange.a', 'a2b', undefined])
    })

    it('should ignore key conflict on binding queue', async function() {
        const D = new RabbitDefine()
            .define_exchange('tarpit.exchange.a', 'topic')
            .define_queue('tarpit.queue.a')
            .bind_queue('tarpit.exchange.a', 'tarpit.queue.a', 'a2b')
        D.bind_queue('tarpit.exchange.a', 'tarpit.queue.a', 'a2b')
        expect(D.queue_bindings.length).to.equal(1)
        expect(D.queue_bindings[0]).to.eql(['tarpit.queue.a', 'tarpit.exchange.a', 'a2b', undefined])
    })
})
