/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Injector, Platform, TpInspector, TpService } from '@tarpit/core'
import chai, { expect } from 'chai'
import chai_as_promised from 'chai-as-promised'
import chai_spies from 'chai-spies'
import { RabbitmqModule, RabbitRetryStrategy } from '../src'
import { is_reachable, RabbitConnector } from '../src/services/rabbit-connector'

chai.use(chai_as_promised)
chai.use(chai_spies)

describe('connection case', function() {

    this.timeout(8000)

    const tmp = console.log
    before(async function() {
        console.log = () => undefined
    })

    after(async function() {
        console.log = tmp
    })

    describe('#is_reachable()', function() {

        it('should tell whether given port is open', async function() {
            await expect(is_reachable('amqp://4.4.4.4:41231', 200)).to.be.rejected
            await expect(is_reachable(`amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:5672`, 200)).not.to.be.rejected
        })

        it('should tell whether default port is open', async function() {
            await expect(is_reachable({}, 200)).to.be.rejected
        })
    })

    describe('error occurred when connecting', function() {

        let platform: Platform
        let injector: Injector
        let inspector: TpInspector
        let connector: RabbitConnector

        beforeEach(async function() {
            platform = new Platform({ rabbitmq: { url: {}, timeout: 200 } })

            injector = platform.expose(Injector)!
            inspector = platform.expose(TpInspector)!
            connector = platform.expose(RabbitConnector)!
        })

        afterEach(async function() {
            platform.terminate()
            await inspector.wait_terminate()
        })

        it('should use custom strategy if provided, will stop retry if throw error from on_failed', async function() {

            @TpService({ inject_root: true })
            class CustomRetryStrategy extends RabbitRetryStrategy {

                async on_failed(err: any): Promise<void> {
                    spy_error()
                    return super.on_failed(err)
                }
            }

            const spy_error: (...args: any[]) => void = chai.spy()
            platform.import({ provide: RabbitRetryStrategy, useClass: CustomRetryStrategy })
            platform.import(RabbitmqModule)
            injector.on('error', ({ type, error }) => console.log(type, error))
            platform.start()
            await inspector.wait_start()
            expect(spy_error).to.have.been.called.once
        })

        it('should use custom strategy if provided, will retry until the max_retries if result of on_failed is fulfilled', async function() {

            const spy_error: (...args: any[]) => void = chai.spy()

            @TpService({ inject_root: true })
            class CustomRetryStrategy extends RabbitRetryStrategy {

                max_retries = 5

                async on_failed(err: any): Promise<void> {
                    spy_error()
                }
            }

            platform.import({ provide: RabbitRetryStrategy, useClass: CustomRetryStrategy })
            platform.import(RabbitmqModule)
            injector.on('error', ({ type, error }) => console.log(type, error))
            platform.start()
            await inspector.wait_start()
            expect(spy_error).to.have.been.called.exactly(5)
        })
    })

    describe('error occurred with after connected', function() {

        it('should mark connector closed if error occurred with code 320 or 200', async function() {
            const url = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:5672`
            const platform = new Platform({ rabbitmq: { url, timeout: 200 } }).import(RabbitmqModule)
            const injector = platform.expose(Injector)!
            injector.on('error', ({ type, error }) => console.log(type, error))
            const inspector = platform.expose(TpInspector)!
            const connector = platform.expose(RabbitConnector)!
            platform.start()
            await inspector.wait_start()
            const mock_error = new Error()
            mock_error['code' as keyof Error] = 320 as any
            connector.connection!.emit('error', mock_error)
            platform.terminate()
            await inspector.wait_terminate()
        })
    })
})
