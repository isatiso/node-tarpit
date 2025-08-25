/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { mkdir, rm, writeFile } from 'fs/promises'
import { resolve } from 'path'
import { setup_mongo, teardown_mongo } from './helpers/test-helper'

export async function setup() {
    const temp_dir = resolve(__dirname, '.tmp')
    await mkdir(temp_dir, { recursive: true })
    const mongo_url = await setup_mongo()
    console.log(mongo_url)
    await writeFile(resolve(temp_dir, 'mongo-url'), mongo_url, 'utf-8')
}

export async function teardown() {
    const temp_dir = resolve(__dirname, '.tmp')
    await teardown_mongo()
    await rm(temp_dir, { recursive: true, force: true })
}
