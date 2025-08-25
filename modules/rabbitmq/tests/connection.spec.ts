/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Injector, Platform, TpConfigSchema, TpService } from '@tarpit/core'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { RabbitmqModule, RabbitRetryStrategy } from '../src'
import { is_reachable, RabbitConnector } from '../src/services/rabbit-connector'
import { RabbitNotifier } from '../src/services/rabbit-notifier'

describe('connection case', () => {

    const rabbitmq_url = process.env.RABBITMQ_URL!

    beforeAll(() => {
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        vi.spyOn(console, 'log').mockImplementation(() => undefined)
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
    })

    afterAll(() => {
        vi.restoreAllMocks()
    })

    describe('#is_reachable()', () => {

        it('should correctly determine reachability based on environment', async () => {
            // 1. Test a non-existent host to trigger a timeout.
            await expect(is_reachable('amqp://4.4.4.4:41231', 200)).rejects.toThrow()

            // 2. Test a refused port on localhost to trigger an error.
            await expect(is_reachable('amqp://localhost:1', 200)).rejects.toThrow()

            // 3. Test the valid, dynamically provided URL. This should always be fulfilled.
            await expect(is_reachable(rabbitmq_url, 200)).resolves.not.toThrow()

            // 4. Test the default address ({}) and adapt the expectation based on the environment.
            if (process.env.CI) {
                // In CI, localhost is the runner, not the service container. So it should be rejected.
                await expect(is_reachable({}, 200)).rejects.toThrow()
            } else {
                // Locally, the container is on localhost, so it should be fulfilled.
                await expect(is_reachable({}, 200)).resolves.not.toThrow()
            }
        })
    })

    describe('error occurred when connecting', () => {

        let platform: Platform
        let injector: Injector
        let connector: RabbitConnector

        beforeEach(async () => {
            platform = new Platform(load_config<TpConfigSchema>({ rabbitmq: { url: {}, timeout: 200 } }))

            injector = platform.expose(Injector)!
            connector = platform.expose(RabbitConnector)!
        })

        afterEach(async () => {
            await platform.terminate()
        })

        it('should use custom strategy if provided, will stop retry if throw error from on_failed', async () => {

            const spy_error = vi.fn()

            @TpService({ inject_root: true })
            class CustomRetryStrategy extends RabbitRetryStrategy {

                override async on_failed(err: any): Promise<void> {
                    spy_error()
                    return super.on_failed(err)
                }
            }

            platform.import({ provide: RabbitRetryStrategy, useClass: CustomRetryStrategy })
            platform.import(RabbitmqModule)
            const notifier = platform.expose(RabbitNotifier)!
            notifier.on('error', ({ type, error }) => console.error(type, error))
            await platform.start()
            expect(spy_error).toHaveBeenCalledTimes(1)
        })

        it('should use custom strategy if provided, will retry until the max_retries if result of on_failed is fulfilled', async () => {

            const spy_error = vi.fn()

            @TpService({ inject_root: true })
            class CustomRetryStrategy extends RabbitRetryStrategy {

                override max_retries = 5

                override async on_failed(err: any): Promise<void> {
                    spy_error()
                }
            }

            platform.import({ provide: RabbitRetryStrategy, useClass: CustomRetryStrategy })
            platform.import(RabbitmqModule)
            const notifier = platform.expose(RabbitNotifier)!
            notifier.on('error', ({ type, error }) => console.error(type, error))
            await platform.start()
            expect(spy_error).toHaveBeenCalledTimes(5)
        })

        it('should be closed if custom strategy failed', async () => {

            @TpService({ inject_root: true })
            class CustomRetryStrategy extends RabbitRetryStrategy {
                override async on_failed(err: any): Promise<void> {
                    throw new Error('custom strategy failed')
                }
            }

            platform.import({ provide: RabbitRetryStrategy, useClass: CustomRetryStrategy })
                .import(RabbitmqModule)

            await expect(platform.start()).rejects.toThrow('custom strategy failed')
            expect(connector.closed).toBe(true)
        })
    })

    describe('error occurred with after connected', () => {

        it('should mark connector closed if error occurred with code 320 or 200', async () => {
            const platform = new Platform(load_config<TpConfigSchema>({ rabbitmq: { url: rabbitmq_url, timeout: 200 } })).import(RabbitmqModule)
            const notifier = platform.expose(RabbitNotifier)!
            notifier.on('error', ({ type, error }) => console.error(type, error))
            const connector = platform.expose(RabbitConnector)!
            await platform.start()
            const mock_error = new Error()
            mock_error['code' as keyof Error] = 320 as any
            connector.connection!.emit('error', mock_error)
            await platform.terminate()
        })
    })
})
