/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import 'reflect-metadata'
import type { StartedTestContainer } from 'testcontainers'

let mongo_container: StartedTestContainer | undefined

export async function setup(): Promise<void> {
    if (process.env.CI) {
        process.env.MONGODB_URL = process.env.MONGODB_URL ?? 'mongodb://admin:admin_password@localhost:27017/test?authSource=admin'
        return
    }

    const { GenericContainer } = await import('testcontainers')

    console.log('Starting MongoDB container...')
    const container = new GenericContainer('mongo:5')
        .withExposedPorts(27017)
        .withEnvironment({
            MONGO_INITDB_ROOT_USERNAME: 'admin',
            MONGO_INITDB_ROOT_PASSWORD: 'admin_password',
            MONGO_INITDB_DATABASE: 'test'
        })
        .withReuse(true)

    mongo_container = await container.start()
    const port = mongo_container.getMappedPort(27017)
    process.env.MONGODB_URL = `mongodb://admin:admin_password@localhost:${port}/test?authSource=admin`
    console.log(`MongoDB container started at ${process.env.MONGODB_URL}`)
}

export async function teardown(): Promise<void> {
    if (process.env.MONGODB_PERSIST) {
        console.log('MONGODB_PERSIST is set, skipping container teardown.')
        return
    }

    if (process.env.CI) {
        return
    }

    if (mongo_container) {
        await mongo_container.stop()
        console.log('MongoDB container stopped.')
    }
}
