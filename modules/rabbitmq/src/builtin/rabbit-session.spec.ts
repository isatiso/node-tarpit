/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ClassProvider, Injector, ValueProvider } from '@tarpit/core'
import { Channel, ConfirmChannel, Connection } from 'amqplib'
import { EventEmitter } from 'events'
import { describe, expect, it, vi } from 'vitest'
import { RabbitConnector } from '../services/rabbit-connector.ts'
import { RabbitNotifier } from '../services/rabbit-notifier'
import { RabbitSession } from './rabbit-session'

describe('rabbit-session.ts', function() {

    describe('RabbitSession', function() {

        describe('.on_channel_create()', function() {

            it('should set _on_channel_create callback to RabbitSession', function() {
                const mock_injector = Injector.create()
                ClassProvider.create(mock_injector, { provide: RabbitNotifier, useClass: RabbitNotifier })
                ValueProvider.create(mock_injector, { provide: RabbitConnector, useValue: { closed: true } })
                const session = new RabbitSession(mock_injector, false)
                const cb = (_channel: Channel) => {
                }
                expect((session as any)._on_channel_create).toBeUndefined()
                session.on_channel_create(cb)
                expect((session as any)._on_channel_create).toEqual(cb)
            })
        })

        describe('.init()', function() {

            function create_mock() {
                const spy_on_channel_create = vi.fn()
                const mock_injector = Injector.create()
                ClassProvider.create(mock_injector, { provide: RabbitNotifier, useClass: RabbitNotifier })
                ValueProvider.create(mock_injector, { provide: RabbitConnector, useValue: { closed: true } })
                const notifier = mock_injector.get(RabbitNotifier)?.create()!
                const spy_notifier_checkout_pipe = vi.spyOn(notifier.checkout$, 'pipe')
                const spy_notifier_channel_error = vi.spyOn(notifier.channel_error$, 'next')
                const spy_notifier_emit = vi.spyOn(notifier, 'emit')
                const mock_channel = new EventEmitter() as Channel
                const mock_confirm_channel = new EventEmitter() as ConfirmChannel
                const spy_channel_once = vi.spyOn(mock_channel, 'once')
                const spy_confirm_channel_once = vi.spyOn(mock_confirm_channel, 'once')
                const mock_connection = {
                    createChannel: () => undefined as any,
                    createConfirmChannel: () => undefined as any,
                } as Connection
                const spy_create_channel = vi.spyOn(mock_connection, 'createChannel').mockResolvedValue(mock_channel)
                const spy_create_confirm_channel = vi.spyOn(mock_connection, 'createConfirmChannel').mockResolvedValue(mock_confirm_channel)
                return {
                    mock_channel,
                    mock_confirm_channel,
                    mock_connection,
                    mock_injector,
                    spy_notifier_channel_error,
                    spy_notifier_checkout_next: spy_notifier_checkout_pipe,
                    spy_notifier_emit,
                    spy_on_channel_create,
                    spy_channel_once,
                    spy_confirm_channel_once,
                    spy_create_confirm_channel,
                    spy_create_channel
                }
            }

            it('should init channel', async function() {
                const {
                    mock_injector,
                    mock_connection,
                    mock_channel,
                    spy_notifier_checkout_next,
                    spy_on_channel_create,
                    spy_channel_once,
                    spy_create_confirm_channel,
                    spy_create_channel
                } = create_mock()
                const session = new RabbitSession(mock_injector, false)
                session.on_channel_create(spy_on_channel_create)
                expect(spy_notifier_checkout_next).toHaveBeenCalledTimes(1)
                const channel = await session.init(mock_connection)
                expect(spy_create_confirm_channel).not.toHaveBeenCalled()
                expect(spy_create_channel).toHaveBeenCalledTimes(1)
                expect(channel).toEqual(mock_channel)
                expect(spy_on_channel_create).toHaveBeenCalledWith(mock_channel)
                expect(spy_channel_once).toHaveBeenCalledWith('close', expect.any(Function))
                expect(spy_channel_once).toHaveBeenCalledWith('error', expect.any(Function))
            })

            it('should init confirm channel', async function() {
                const {
                    mock_injector,
                    mock_connection,
                    mock_confirm_channel,
                    spy_notifier_checkout_next,
                    spy_on_channel_create,
                    spy_confirm_channel_once,
                    spy_create_confirm_channel,
                    spy_create_channel
                } = create_mock()
                const session = new RabbitSession(mock_injector, true)
                session.on_channel_create(spy_on_channel_create)
                expect(spy_notifier_checkout_next).toHaveBeenCalledTimes(1)
                const channel = await session.init(mock_connection)
                expect(spy_create_channel).not.toHaveBeenCalled()
                expect(spy_create_confirm_channel).toHaveBeenCalledTimes(1)
                expect(channel).toEqual(mock_confirm_channel)
                expect(spy_on_channel_create).toHaveBeenCalledWith(mock_confirm_channel)
                expect(spy_confirm_channel_once).toHaveBeenCalledWith('close', expect.any(Function))
                expect(spy_confirm_channel_once).toHaveBeenCalledWith('error', expect.any(Function))
            })

            it('should init on injector event "rabbitmq-checked-out"', async function() {
                const { mock_injector, mock_connection } = create_mock()
                const session = new RabbitSession(mock_injector, true)
                const spy_session_init = vi.spyOn(session, 'init')
                const notifier = mock_injector.get(RabbitNotifier)?.create()!
                notifier.checkout$.next(mock_connection)
                await new Promise(resolve => setTimeout(resolve, 0))
                expect(spy_session_init).toHaveBeenCalledTimes(1)
            })

            it.skip('should init on channel event "close"', async function() {
                const { mock_injector, mock_connection } = create_mock()
                const session = new RabbitSession(mock_injector, true)
                const channel = await session.init(mock_connection)
                const spy_session_init = vi.spyOn(session, 'init')
                expect(session.channel).toEqual(channel)
                channel!.emit('close')
                await new Promise(resolve => setTimeout(resolve, 0))
                expect(spy_session_init).toHaveBeenCalledTimes(1)
            })

            it('should emit "channel-error" event to notifier on channel event "error"', async function() {
                const { mock_injector, mock_connection, spy_notifier_channel_error } = create_mock()
                const notifier = mock_injector.get(RabbitNotifier)?.create()!
                notifier.on('error', () => undefined)
                const session = new RabbitSession(mock_injector, true)
                const channel = await session.init(mock_connection)
                expect(session.channel).toEqual(channel)
                channel!.emit('error', 'something')
                await new Promise(resolve => setTimeout(resolve, 0))
                expect(spy_notifier_channel_error).toHaveBeenCalledTimes(1)
            })
        })
    })
})
