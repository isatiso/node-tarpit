/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Injector } from '@tarpit/core'
import { Channel, Connection } from 'amqplib'
import chai, { expect } from 'chai'
import chai_spies from 'chai-spies'
import { EventEmitter } from 'events'
import { RabbitSession } from './rabbit-session'

chai.use(chai_spies)

describe('rabbit-session.ts', function() {

    describe('RabbitSession', function() {

        describe('.on_channel_create()', function() {

            it('should set _on_channel_create callback to RabbitSession', function() {
                const session = new RabbitSession(Injector.create(), false)
                const cb = (_channel: Channel) => {
                }
                expect((session as any)._on_channel_create).to.be.undefined
                session.on_channel_create(cb)
                expect((session as any)._on_channel_create).to.equal(cb)
            })
        })

        describe('.init()', function() {

            function create_mock() {
                const spy_on_channel_create = chai.spy()
                const mock_injector = new EventEmitter() as unknown as Injector
                const spy_injector_on = chai.spy.on(mock_injector, 'on')
                const spy_injector_emit = chai.spy.on(mock_injector, 'emit')
                const mock_channel = new EventEmitter() as Channel
                const spy_channel_once = chai.spy.on(mock_channel, 'once')
                const mock_connection = {} as Connection
                const spy_create_channel = chai.spy.on(mock_connection, 'createChannel', () => mock_channel)
                const spy_create_confirm_channel = chai.spy.on(mock_connection, 'createConfirmChannel', () => mock_channel)
                return { mock_channel, mock_connection, mock_injector, spy_injector_on, spy_injector_emit, spy_on_channel_create, spy_channel_once, spy_create_confirm_channel, spy_create_channel }
            }

            it('should init channel', async function() {
                const { mock_injector, mock_connection, mock_channel, spy_injector_on, spy_on_channel_create, spy_channel_once, spy_create_confirm_channel, spy_create_channel } = create_mock()
                const session = new RabbitSession(mock_injector, false)
                session.on_channel_create(spy_on_channel_create)
                expect(spy_injector_on).to.have.been.called.with('rabbitmq-checked-out')
                const channel = await session.init(mock_connection)
                expect(spy_create_confirm_channel).to.have.not.been.called()
                expect(spy_create_channel).to.have.been.called.once
                expect(channel).to.equal(mock_channel)
                expect(spy_on_channel_create).to.have.been.called.with(mock_channel)
                expect(spy_channel_once).to.have.been.called.with('close')
                expect(spy_channel_once).to.have.been.called.with('error')
            })

            it('should init confirm channel', async function() {
                const { mock_injector, mock_connection, mock_channel, spy_injector_on, spy_on_channel_create, spy_channel_once, spy_create_confirm_channel, spy_create_channel } = create_mock()
                const session = new RabbitSession(mock_injector, true)
                session.on_channel_create(spy_on_channel_create)
                expect(spy_injector_on).to.have.been.called.with('rabbitmq-checked-out')
                const channel = await session.init(mock_connection)
                expect(spy_create_channel).to.have.not.been.called()
                expect(spy_create_confirm_channel).to.have.been.called.once
                expect(channel).to.equal(mock_channel)
                expect(spy_on_channel_create).to.have.been.called.with(mock_channel)
                expect(spy_channel_once).to.have.been.called.with('close')
                expect(spy_channel_once).to.have.been.called.with('error')
            })

            it('should init on injector event "rabbitmq-checked-out"', async function() {
                const { mock_injector, mock_connection } = create_mock()
                const session = new RabbitSession(mock_injector, true)
                const spy_session_init = chai.spy.on(session, 'init', () => undefined)
                mock_injector.emit('rabbitmq-checked-out', mock_connection)
                await new Promise(resolve => setTimeout(resolve, 0))
                expect(spy_session_init).to.have.been.called.once
            })

            it('should init on channel event "close"', async function() {
                const { mock_injector, mock_connection } = create_mock()
                const session = new RabbitSession(mock_injector, true)
                const channel = await session.init(mock_connection)
                const spy_session_init = chai.spy.on(session, 'init', () => undefined)
                expect(session.channel).to.equal(channel)
                channel.emit('close')
                await new Promise(resolve => setTimeout(resolve, 0))
                expect(spy_session_init).to.have.been.called.once
            })

            it('should emit "channel-error" event to injector on channel event "error"', async function() {
                const { mock_injector, mock_connection, spy_injector_emit } = create_mock()
                mock_injector.on('error', err => undefined)
                const session = new RabbitSession(mock_injector, true)
                const channel = await session.init(mock_connection)
                expect(session.channel).to.equal(channel)
                channel.emit('error', 'something')
                await new Promise(resolve => setTimeout(resolve, 0))
                expect(spy_injector_emit).to.have.been.called.once
            })
        })
    })
})
