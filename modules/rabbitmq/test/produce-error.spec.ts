/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpModule } from '@tarpit/core'
import amqplib, { Connection } from 'amqplib'
import chai, { expect } from 'chai'
import chai_as_promised from 'chai-as-promised'
import { ConfirmProducer, Publish, RabbitmqModule, TpProducer } from '../src'
import { rabbitmq_url } from './helpers/test-helper'

chai.use(chai_as_promised)

describe('produce error case', function() {

    let publish_confirm_promise: any

    @TpProducer({})
    class TempProducer {
        @Publish('tarpit.not.exists', 'confirm')
        publish_not_exists!: ConfirmProducer<string>
    }

    @TpModule({
        imports: [TempProducer]
    })
    class TempModule {

        constructor(
            private producer: TempProducer
        ) {
            publish_confirm_promise = this.producer.publish_not_exists.send('publish_confirm').catch(err => err)
        }
    }

    let connection: Connection
    let platform: Platform
    let producer: TempProducer

    const sandbox = chai.spy.sandbox()

    before(async function() {
        sandbox.on(console, ['debug', 'log', 'info', 'warn', 'error'], () => undefined)
        connection = await amqplib.connect(rabbitmq_url)
        platform = new Platform(load_config<TpConfigSchema>({ rabbitmq: { url: rabbitmq_url } }))
            .import(RabbitmqModule)
            .import(TempModule)

        await platform.start()
        producer = platform.expose(TempProducer)!
        await new Promise(resolve => setTimeout(resolve, 200))
    })

    after(async function() {
        await platform.terminate()
        await connection.close()
        sandbox.restore()
    })

    it('should reject cached promise with error', async function() {
        expect(await publish_confirm_promise).to.be.instanceof(Error)
    })

    it('should reject directly call with error', async function() {
        const res = producer.publish_not_exists.send('publish_confirm')
        await expect(res).to.be.rejected
    })
})
