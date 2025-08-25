/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform } from '@tarpit/core'
import { readFile } from 'fs/promises'
import { ObjectId, WithId } from 'mongodb'
import { resolve } from 'path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { GenericCollection, MongodbModule, TpMongo } from '../src'

@TpMongo('test', 'normal')
class TestMongo extends GenericCollection<{ name: string, age: number, created_at: number, updated_at: number }>() {
    get_by_name(name: string): Promise<WithId<{ name: string; age: number; created_at: number; updated_at: number }> | null> {
        return this.findOne({ name })
    }
}

describe('normal case', function() {

    let platform: Platform
    let mongodb_url: string

    beforeAll(async function() {
        mongodb_url = await readFile(resolve(__dirname, '.tmp/mongo-url'), 'utf-8')
        vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        vi.spyOn(console, 'log').mockImplementation(() => undefined)
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        platform = new Platform(load_config({ mongodb: { url: mongodb_url } }))
            .import(MongodbModule)
            .import(TestMongo)
        await platform.start()
    }, 30000)

    afterAll(async function() {
        await platform.terminate()
        vi.restoreAllMocks()
    })

    it('should add a doc to the collection', async function() {
        const now = Date.now()
        const user_mongo = platform.expose(TestMongo)!
        const res = await user_mongo.insertOne({ name: 'Mike', age: 18, created_at: now, updated_at: now })
        expect(res.insertedId).toBeInstanceOf(ObjectId)
    })

    it('should get the doc of the collection', async function() {
        const user_mongo = platform.expose(TestMongo)!
        const res = await user_mongo.get_by_name('Mike')
        expect(res).is.not.null
        expect(res?.name).toEqual('Mike')
        expect(res?.age).toEqual(18)
    })

    it('should update the doc of the collection', async function() {
        const user_mongo = platform.expose(TestMongo)!
        const res = await user_mongo.updateOne({ name: 'Mike' }, { $set: { age: 19 } })
        expect(res?.matchedCount).toEqual(1)
        expect(res?.modifiedCount).toEqual(1)
        const doc = await user_mongo.get_by_name('Mike')
        expect(doc?.age).toEqual(19)
    })

    it('should delete the doc of the collection', async function() {
        const user_mongo = platform.expose(TestMongo)!
        const res = await user_mongo.deleteOne({ name: 'Mike' })
        expect(res?.deletedCount).toEqual(1)
        const doc = await user_mongo.get_by_name('Mike')
        expect(doc).toBeNull()
    })
})
