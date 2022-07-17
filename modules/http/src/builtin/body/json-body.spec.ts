/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { MIMEContent } from '@tarpit/content-type'
import { Jtl, Judgement } from '@tarpit/judge'
import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { JsonBody } from './json-body'

chai.use(cap)

describe('json-body.ts', function() {

    const content: MIMEContent<any> = {
        type: 'application/json',
        charset: 'utf-8',
        parameters: { charset: 'utf-8' },
        raw: Buffer.from('{"a":1,"b":"黑龙江"}')
    }

    describe('JsonBody', function() {

        it('should new instance', function() {
            const instance = new JsonBody(content)
            expect(instance).to.be.instanceof(Judgement)
            expect(instance.data).to.eql({ a: 1, b: '黑龙江' })
        })

        it('should throw error if parsed JSON is not object', function() {
            const h_content = { ...content, raw: Buffer.from('["a","b"]') }
            expect(() => new JsonBody(h_content)).to.throw('Invalid JSON, only supports object')
        })

        it('should throw error if fail to decode content', function() {
            const h_content = { ...content, charset: 'undefined' }
            expect(() => new JsonBody(h_content)).to.throw('Fail to decode content')
        })

        it('should throw error if error occurred when parsing', function() {
            const h_content = { ...content, raw: Buffer.from('{a:123}') }
            expect(() => new JsonBody(h_content)).to.throw('Fail to parse body in JSON format')
        })

        it('should use "utf-8" if charset not specified', function() {
            const instance = new JsonBody({ ...content, charset: undefined })
            expect(instance).to.be.instanceof(Judgement)
            expect(instance.data).to.eql({ a: 1, b: '黑龙江' })
        })

        describe('#on_error()', function() {

            it('should be called when judgement not match', function() {
                const instance = new JsonBody<{ a: string | number, b: string }>(content)
                expect(() => instance.ensure('a', Jtl.number)).to.not.throw()
                expect(() => instance.ensure('a', Jtl.string)).to.throw('Body parameter of [a] does not match the rule: [is string]')
            })

            it('should be use custom on_error function if given', function() {
                const instance = new JsonBody<{ a: string | number, b: string }>(content)
                expect(() => instance.ensure('a', Jtl.string, (prop, desc) => `${prop} -> ${desc.rule}`))
                    .to.throw('a -> is string')
            })
        })
    })
})
