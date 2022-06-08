/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { UUID } from './uuid'

chai.use(cap)

describe('uuid.ts', function() {

    let uuid: UUID

    describe('class UUID()', function() {
        it('should new instance without parameters', function() {
            expect(() => uuid = new UUID()).not.to.throw()
        })
    })

    describe('UUID#create()', function() {
        it('should create uuid as long format', function() {
            const id = uuid.create()
            expect(id).to.match(/^[\da-f]{32}$/)
        })

        it('should create uuid as short format', function() {
            const id = uuid.create('short')
            expect(id).to.match(/^[\da-f]{20}$/)
        })

        it('should create uuid never repeated', function() {
            const set = new Set()
            for (let i = 0; i < 10000; i++) {
                set.add(uuid.create())
            }
            expect(set.size).to.equal(10000)
        })

        it('should create short uuid never repeated', function() {
            const set = new Set()
            for (let i = 0; i < 10000; i++) {
                set.add(uuid.create('short'))
            }
            expect(set.size).to.equal(10000)
        })
    })
})
