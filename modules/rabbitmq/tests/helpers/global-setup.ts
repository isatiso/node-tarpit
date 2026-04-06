/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import 'reflect-metadata'

export async function setup(): Promise<void> {
    process.env.RABBITMQ_URL = process.env.RABBITMQ_URL ?? 'amqp://admin:admin_password@localhost:5672'
}

export async function teardown(): Promise<void> {
}
