/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import 'reflect-metadata'

export async function setup(): Promise<void> {
    process.env.MONGODB_URL = process.env.MONGODB_URL ?? 'mongodb://admin:admin_password@localhost:27017/test?authSource=admin'
}

export async function teardown(): Promise<void> {
}
