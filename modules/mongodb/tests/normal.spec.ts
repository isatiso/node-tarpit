/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import { Platform, TpInspector, TpRoot } from '@tarpit/core'
import { expect } from 'chai'
import { ObjectId, WithId } from 'mongodb'
import { GenericCollection, MongodbModule, TpMongo } from '../src'

@TpMongo('test', 'user')
class TestUserMongo extends GenericCollection<{ name: string, age: number, created_at: number, updated_at: number }>() {
    get_by_name(name: string): Promise<WithId<{ name: string; age: number; created_at: number; updated_at: number }> | null> {
        return this.findOne({ name })
    }
}

@TpRoot({
    providers: [
        TestUserMongo,
        // TestInnerUserMongo,
    ]
})
class TempRoot {
}

describe('normal case', function() {

    // this.slow(200)

    const url = process.env.MONGODB_URL ?? ''
    let platform: Platform
    let inspector: TpInspector
    let user_mongo: TestUserMongo

    const tmp = console.log
    before(async function() {
        console.log = () => undefined
        platform = new Platform(load_config({ mongodb: { url } }))
            .import(MongodbModule)
            .import(TempRoot)

        inspector = platform.expose(TpInspector)!
        user_mongo = platform.expose(TestUserMongo)!
        platform.start()
        await inspector.wait_start()
        await new Promise(resolve => setTimeout(resolve, 200))
    })

    after(async function() {
        await user_mongo.deleteMany({})
        platform.terminate()
        await inspector.wait_terminate()
        console.log = tmp
    })

    it('should add a doc to the collection', async function() {
        const now = Date.now()
        const res = await user_mongo.insertOne({ name: 'Mike', age: 18, created_at: now, updated_at: now })
        expect(res.insertedId).to.be.an.instanceof(ObjectId)
    })

    it('should get the doc of the collection', async function() {
        const res = await user_mongo.get_by_name('Mike')
        expect(res).is.not.null
        expect(res?.name).to.equal('Mike')
        expect(res?.age).to.equal(18)
    })

    it('should update the doc of the collection', async function() {
        const res = await user_mongo.updateOne({ name: 'Mike' }, { $set: { age: 19 } })
        expect(res?.matchedCount).to.equal(1)
        expect(res?.modifiedCount).to.equal(1)
        const doc = await user_mongo.get_by_name('Mike')
        expect(doc?.age).to.equal(19)
    })

    it('should delete the doc of the collection', async function() {
        const res = await user_mongo.deleteOne({ name: 'Mike' })
        expect(res?.deletedCount).to.equal(1)
        const doc = await user_mongo.get_by_name('Mike')
        expect(doc).is.null
    })
})
