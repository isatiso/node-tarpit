/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Platform, TpInspector, TpRoot } from '@tarpit/core'
import amqplib, { Connection } from 'amqplib'
import chai, { expect } from 'chai'
import chai_as_promised from 'chai-as-promised'
import { ConfirmProducer, Publish, RabbitmqModule, TpProducer } from '../src'

chai.use(chai_as_promised)

describe('produce error case', function() {

    let publish_confirm_promise: any

    @TpProducer({})
    class TempProducer {
        @Publish('tarpit.not.exists', 'confirm')
        publish_not_exists!: ConfirmProducer<string>
    }

    @TpRoot({
        imports: [TempProducer]
    })
    class TempRoot {

        constructor(
            private producer: TempProducer
        ) {
            publish_confirm_promise = this.producer.publish_not_exists.send('publish_confirm').catch(err => err)
        }
    }

    this.timeout(8000)

    const url = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:5672`
    let connection: Connection
    let platform: Platform
    let inspector: TpInspector
    let producer: TempProducer

    const tmp = console.log
    before(async function() {
        console.log = () => undefined
        connection = await amqplib.connect(url)
        platform = new Platform({ rabbitmq: { url } })
            .import(RabbitmqModule)
            .import(TempRoot)

        inspector = platform.expose(TpInspector)!
        // const injector = platform.expose(Injector)!
        // injector.on('channel-error', err => console.log('channel-error', err))
        platform.start()
        await inspector.wait_start()
        producer = platform.expose(TempProducer)!
        await new Promise(resolve => setTimeout(resolve, 200))
    })

    after(async function() {
        platform.terminate()
        await inspector.wait_terminate()
        await connection.close()
        console.log = tmp
    })

    it('should reject cached promise with error', async function() {
        expect(await publish_confirm_promise).to.be.instanceof(Error)
    })

    it('should reject directly call with error', async function() {
        const res = producer.publish_not_exists.send('publish_confirm')
        await expect(res).to.be.rejected
    })
})
