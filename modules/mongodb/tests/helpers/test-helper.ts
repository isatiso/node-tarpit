/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { GenericContainer, StartedTestContainer } from 'testcontainers'

let mongo_container: StartedTestContainer | undefined
export let mongodb_url: string

export async function setup_mongo(): Promise<string> {
    if (process.env.CI) {
        mongodb_url = process.env.MONGODB_URL ?? 'mongodb://admin:admin_password@localhost:27017/test?authSource=admin'
        return mongodb_url
    }

    console.log('Starting MongoDB container...')
    const container = new GenericContainer('mongo:5')
        .withExposedPorts(27017)
        .withEnvironment({
            MONGO_INITDB_ROOT_USERNAME: 'admin',
            MONGO_INITDB_ROOT_PASSWORD: 'admin_password',
            MONGO_INITDB_DATABASE: 'test'
        })

    mongo_container = await container.start()
    const port = mongo_container.getMappedPort(27017)
    mongodb_url = `mongodb://admin:admin_password@localhost:${port}/test?authSource=admin`
    console.log(`MongoDB container started at ${mongodb_url}`)
    return mongodb_url
}

export async function teardown_mongo(): Promise<void> {
    if (process.env.CI) {
        return
    }

    if (mongo_container) {
        console.log('Stopping MongoDB container...')
        await mongo_container.stop()
        console.log('MongoDB container stopped.')
    }
}
