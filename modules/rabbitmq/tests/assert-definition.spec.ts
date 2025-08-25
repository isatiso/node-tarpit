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
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { RabbitDefine, RabbitDefineToken, RabbitmqModule } from '../src'
import { RabbitNotifier } from '../src/services/rabbit-notifier'

describe('assert definition case', function() {

    const rabbitmq_url = process.env.RABBITMQ_URL!

    beforeAll(async function() {
        console.log('rabbitmq_url', rabbitmq_url)
        // vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        // vi.spyOn(console, 'log').mockImplementation(() => undefined)
        // vi.spyOn(console, 'info').mockImplementation(() => undefined)
        // vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        // vi.spyOn(console, 'error').mockImplementation(() => undefined)
    })

    afterAll(async function() {
        const connection = await connect(rabbitmq_url)
        const channel = await connection.createChannel()
        await channel.deleteExchange('tarpit.exchange.assert-def.a', { ifUnused: false })
        await channel.deleteExchange('tarpit.exchange.assert-def.b', { ifUnused: false })
        await channel.deleteExchange('tarpit.exchange.assert-def.c', { ifUnused: false })
        await channel.deleteQueue('tarpit.queue.assert-def.a', { ifUnused: false, ifEmpty: false })
        await channel.deleteQueue('tarpit.queue.assert-def.b', { ifUnused: false, ifEmpty: false })
        await channel.deleteQueue('tarpit.queue.assert-def.c', { ifUnused: false, ifEmpty: false })
        await channel.close()
        await connection.close()
        vi.restoreAllMocks()
    })

    it('should assert definition as provide', { timeout: 20000 }, async function() {

        const D = new RabbitDefine()
            .define_exchange('tarpit.exchange.assert-def.a', 'topic')
            .define_exchange('tarpit.exchange.assert-def.b', 'topic')
            .define_exchange('tarpit.exchange.assert-def.c', 'topic')
            .define_queue('tarpit.queue.assert-def.a')
            .define_queue('tarpit.queue.assert-def.b')
            .define_queue('tarpit.queue.assert-def.c')
            .bind_exchange('tarpit.exchange.assert-def.a', 'tarpit.exchange.assert-def.b', 'a-to-b')
            .bind_queue('tarpit.exchange.assert-def.a', 'tarpit.queue.assert-def.a', 'aa')
            .bind_queue('tarpit.exchange.assert-def.b', 'tarpit.queue.assert-def.b', 'bb')
            .bind_queue('tarpit.exchange.assert-def.c', 'tarpit.queue.assert-def.c', 'cc')

        const platform = new Platform(load_config<TpConfigSchema>({ rabbitmq: { url: rabbitmq_url } }))
            .import({ provide: RabbitDefineToken, useValue: D, multi: true, root: true })
            .import(RabbitmqModule)

        await platform.start()

        const connection = await connect(rabbitmq_url)
        const channel = await connection.createChannel()
        const [a, b, c, d, e, f] = await Promise.all([
            channel.checkExchange(D.X['tarpit.exchange.assert-def.a']),
            channel.checkExchange(D.X['tarpit.exchange.assert-def.b']),
            channel.checkExchange(D.X['tarpit.exchange.assert-def.c']),
            channel.checkQueue(D.Q['tarpit.queue.assert-def.a']),
            channel.checkQueue(D.Q['tarpit.queue.assert-def.b']),
            channel.checkQueue(D.Q['tarpit.queue.assert-def.c']),
        ])
        expect(a).toEqual({})
        expect(b).toEqual({})
        expect(c).toEqual({})
        expect(d).toEqual({ consumerCount: 0, messageCount: 0, queue: 'tarpit.queue.assert-def.a' })
        expect(e).toEqual({ consumerCount: 0, messageCount: 0, queue: 'tarpit.queue.assert-def.b' })
        expect(f).toEqual({ consumerCount: 0, messageCount: 0, queue: 'tarpit.queue.assert-def.c' })

        await channel.close()
        await platform.terminate()

        await connection.close()
    })

    it('should throw error if definition conflicted', async function() {
        const D = new RabbitDefine().define_exchange('tarpit.exchange.assert-def.a', 'direct', { durable: true })
        const platform = new Platform(load_config<TpConfigSchema>({ rabbitmq: { url: rabbitmq_url } }))
        platform.import({ provide: RabbitDefineToken, useValue: D, multi: true, root: true })
            .import(RabbitmqModule)

        const notifier = platform.expose(RabbitNotifier)!
        const spy_on_error = vi.fn()
        notifier.on('error', ({ type }) => {
            if (type === 'rabbitmq.connection.error' || type === 'rabbitmq.assert.definition.failed') {
                spy_on_error(type)
            }
        })

        await platform.start()
        await platform.terminate()

        expect(spy_on_error).toHaveBeenNthCalledWith(1, 'rabbitmq.connection.error')
        expect(spy_on_error).toHaveBeenNthCalledWith(2, 'rabbitmq.assert.definition.failed')
    })

    it('should ignore key conflict on defining exchange', async function() {
        const D = new RabbitDefine().define_exchange('tarpit.exchange.assert-def.a', 'direct')
        D.define_exchange('tarpit.exchange.assert-def.a' as any, 'topic')
        expect(D.exchange_defines.length).to.equal(1)
        expect(D.exchange_defines[0][1]).to.equal('direct')
    })

    it('should ignore key conflict on defining queue', async function() {
        const D = new RabbitDefine().define_queue('tarpit.queue.assert-def.a', { expires: 1000 })
        D.define_queue('tarpit.queue.assert-def.a' as any, { expires: 500 })
        expect(D.queue_defines.length).to.equal(1)
        expect(D.queue_defines[0][1]).toEqual({ expires: 1000 })
    })

    it('should ignore key conflict on binding exchange', async function() {
        const D = new RabbitDefine()
            .define_exchange('tarpit.exchange.assert-def.a', 'topic')
            .define_exchange('tarpit.exchange.assert-def.b', 'topic')
            .bind_exchange('tarpit.exchange.assert-def.a', 'tarpit.exchange.assert-def.b', 'a2b')
        D.bind_exchange('tarpit.exchange.assert-def.a', 'tarpit.exchange.assert-def.b', 'a2b')
        expect(D.exchange_bindings.length).to.equal(1)
        expect(D.exchange_bindings[0]).toEqual(['tarpit.exchange.assert-def.b', 'tarpit.exchange.assert-def.a', 'a2b', undefined])
    })

    it('should ignore key conflict on binding queue', async function() {
        const D = new RabbitDefine()
            .define_exchange('tarpit.exchange.assert-def.a', 'topic')
            .define_queue('tarpit.queue.assert-def.a')
            .bind_queue('tarpit.exchange.assert-def.a', 'tarpit.queue.assert-def.a', 'a2b')
        D.bind_queue('tarpit.exchange.assert-def.a', 'tarpit.queue.assert-def.a', 'a2b')
        expect(D.queue_bindings.length).to.equal(1)
        expect(D.queue_bindings[0]).toEqual(['tarpit.queue.assert-def.a', 'tarpit.exchange.assert-def.a', 'a2b', undefined])
    })
})
