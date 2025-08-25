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
import timers from 'node:timers/promises'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { ConfirmProducer, Publish, RabbitmqModule, TpProducer } from '../src'

describe('produce error case', () => {

    const rabbitmq_url = process.env.RABBITMQ_URL!
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

    beforeAll(async () => {
        // vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        // vi.spyOn(console, 'log').mockImplementation(() => undefined)
        // vi.spyOn(console, 'info').mockImplementation(() => undefined)
        // vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        // vi.spyOn(console, 'error').mockImplementation(() => undefined)
        connection = await amqplib.connect(rabbitmq_url)
        platform = new Platform(load_config<TpConfigSchema>({ rabbitmq: { url: rabbitmq_url } }))
            .import(RabbitmqModule)
            .import(TempModule)

        await platform.start()
        producer = platform.expose(TempProducer)!
        await timers.setTimeout(50)
    })

    afterAll(async () => {
        await platform.terminate()
        await connection.close()
        vi.restoreAllMocks()
    })

    it('should reject cached promise with error', async () => {
        expect(await publish_confirm_promise).toBeInstanceOf(Error)
    })

    it('should reject directly call with error', async () => {
        const res = producer.publish_not_exists.send('publish_confirm')
        await expect(res).rejects.toThrow()
    })
})
