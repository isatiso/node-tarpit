/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Injector, Platform, TpConfigSchema, TpService } from '@tarpit/core'
import chai, { expect } from 'chai'
import chai_as_promised from 'chai-as-promised'
import chai_spies from 'chai-spies'
import { RabbitmqModule, RabbitRetryStrategy } from '../src'
import { is_reachable, RabbitConnector } from '../src/services/rabbit-connector'
import { RabbitNotifier } from '../src/services/rabbit-notifier'
import { rabbitmq_url } from './helpers/test-helper'

chai.use(chai_as_promised)
chai.use(chai_spies)

describe('connection case', function() {

    const sandbox = chai.spy.sandbox()

    before(function() {
        sandbox.on(console, ['debug', 'log', 'info', 'warn', 'error'], () => undefined)
    })

    after(function() {
        sandbox.restore()
    })

    describe('#is_reachable()', function() {

        it('should correctly determine reachability based on environment', async function() {
            // 1. Test a non-existent host to trigger a timeout.
            await expect(is_reachable('amqp://4.4.4.4:41231', 200)).to.be.rejected

            // 2. Test a refused port on localhost to trigger an error.
            await expect(is_reachable('amqp://localhost:1', 200)).to.be.rejected

            // 3. Test the valid, dynamically provided URL. This should always be fulfilled.
            await expect(is_reachable(rabbitmq_url, 200)).to.be.fulfilled

            // 4. Test the default address ({}) and adapt the expectation based on the environment.
            if (process.env.CI) {
                // In CI, localhost is the runner, not the service container. So it should be rejected.
                await expect(is_reachable({}, 200)).to.be.rejected
            } else {
                // Locally, the container is on localhost, so it should be fulfilled.
                await expect(is_reachable({}, 200)).to.be.fulfilled
            }
        })
    })

    describe('error occurred when connecting', function() {

        let platform: Platform
        let injector: Injector
        let connector: RabbitConnector

        beforeEach(async function() {
            platform = new Platform(load_config<TpConfigSchema>({ rabbitmq: { url: {}, timeout: 200 } }))

            injector = platform.expose(Injector)!
            connector = platform.expose(RabbitConnector)!
        })

        afterEach(async function() {
            await platform.terminate()
        })

        it('should use custom strategy if provided, will stop retry if throw error from on_failed', async function() {

            @TpService({ inject_root: true })
            class CustomRetryStrategy extends RabbitRetryStrategy {

                override async on_failed(err: any): Promise<void> {
                    spy_error()
                    return super.on_failed(err)
                }
            }

            const spy_error: (...args: any[]) => void = chai.spy()
            platform.import({ provide: RabbitRetryStrategy, useClass: CustomRetryStrategy })
            platform.import(RabbitmqModule)
            const notifier = platform.expose(RabbitNotifier)!
            notifier.on('error', ({ type, error }) => console.error(type, error))
            await platform.start()
            expect(spy_error).to.have.been.called.once
        })

        it('should use custom strategy if provided, will retry until the max_retries if result of on_failed is fulfilled', async function() {

            const spy_error: (...args: any[]) => void = chai.spy()

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
            expect(spy_error).to.have.been.called.exactly(5)
        })
    })

    describe('error occurred with after connected', function() {

        it('should mark connector closed if error occurred with code 320 or 200', async function() {
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
