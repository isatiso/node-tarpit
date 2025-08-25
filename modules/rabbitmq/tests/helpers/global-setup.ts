/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import 'reflect-metadata'
import type { StartedTestContainer } from 'testcontainers'

let rabbit_container: StartedTestContainer | undefined

export async function setup(): Promise<void> {
    if (process.env.CI) {
        process.env.RABBITMQ_URL = process.env.RABBITMQ_URL ?? 'amqp://admin:admin_password@localhost:5672'
        return
    }

    const { GenericContainer } = await import('testcontainers')

    console.log('Starting RabbitMQ container...')
    const container = new GenericContainer('rabbitmq:3.11-management')
        .withExposedPorts(5672, 15672)
        .withEnvironment({
            RABBITMQ_DEFAULT_USER: 'admin',
            RABBITMQ_DEFAULT_PASS: 'admin_password'
        })
        .withReuse(true)

    rabbit_container = await container.start()
    const amqp_port = rabbit_container.getMappedPort(5672)
    const management_port = rabbit_container.getMappedPort(15672)
    process.env.RABBITMQ_URL = `amqp://admin:admin_password@localhost:${amqp_port}`
    console.log(`RabbitMQ container started. AMQP: ${process.env.RABBITMQ_URL}, Management UI: http://localhost:${management_port}`)
}

export async function teardown(): Promise<void> {
    if (process.env.RABBITMQ_PERSIST) {
        console.log('RABBITMQ_PERSIST is set, skipping container teardown.')
        return
    }

    if (process.env.CI) {
        return
    }

    if (rabbit_container) {
        await rabbit_container.stop()
        console.log('RabbitMQ container stopped.')
    }
}
