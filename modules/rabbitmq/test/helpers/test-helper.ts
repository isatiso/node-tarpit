/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { GenericContainer, StartedTestContainer } from 'testcontainers'

let rabbit_container: StartedTestContainer | undefined
export let rabbitmq_url: string

export async function setup_rabbitmq(): Promise<string> {
    if (process.env.CI) {
        rabbitmq_url = process.env.RABBITMQ_URL ?? 'amqp://admin:admin_password@localhost:5672'
        return rabbitmq_url
    }

    const container = new GenericContainer('rabbitmq:3.11-management')
        .withExposedPorts(5672)
        .withEnvironment({
            RABBITMQ_DEFAULT_USER: 'admin',
            RABBITMQ_DEFAULT_PASS: 'admin_password'
        })

    rabbit_container = await container.start()
    const port = rabbit_container.getMappedPort(5672)
    rabbitmq_url = `amqp://admin:admin_password@localhost:${port}`
    console.log(`RabbitMQ container started at ${rabbitmq_url}`)
    return rabbitmq_url
}

export async function teardown_rabbitmq(): Promise<void> {
    if (process.env.CI) {
        return
    }

    if (rabbit_container) {
        await rabbit_container.stop()
        console.log('RabbitMQ container stopped.')
    }
}
