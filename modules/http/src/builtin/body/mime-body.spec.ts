/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Judgement } from '@tarpit/judge'
import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { MimeBody } from './mime-body'

chai.use(cap)

describe('mime-body.ts', function() {

    describe('MimeBody', function() {

        it('should new instance', function() {
            const instance = new MimeBody({
                type: 'text/plain',
                charset: 'utf-8',
                parameters: { charset: 'utf-8' },
                raw: Buffer.from('{"a":1,"b":"黑龙江"}'),
                text: '{"a":1,"b":"黑龙江"}',
                data: '{"a":1,"b":"黑龙江"}',
            })
            expect(instance.data).to.equal('{"a":1,"b":"黑龙江"}')
            expect(instance.checker).to.be.undefined
        })

        it('should create checker if data is object', function() {
            const instance = new MimeBody({
                type: 'application/json',
                charset: 'utf-8',
                parameters: { charset: 'utf-8' },
                raw: Buffer.from('{"a":1,"b":"黑龙江"}'),
                text: '{"a":1,"b":"黑龙江"}',
                data: { a: 1, b: '黑龙江' }
            })
            expect(instance.data).to.eql({ a: 1, b: '黑龙江' })
            expect(instance.checker).to.be.instanceof(Judgement)
        })
    })
})
