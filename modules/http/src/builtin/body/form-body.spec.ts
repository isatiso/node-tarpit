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
import { FormBody } from './form-body'

chai.use(cap)

describe('form-body.ts', function() {

    const content: MIMEContent<any> = {
        type: 'application/x-www-form-urlencoded',
        charset: 'utf-8',
        parameters: { charset: 'utf-8' },
        raw: Buffer.from('a=1&b=黑龙江')
    }

    describe('FormBody', function() {

        it('should new instance', function() {
            const instance = new FormBody(content)
            expect(instance).to.be.instanceof(Judgement)
            expect(instance.data).to.eql({ a: '1', b: '黑龙江' })
        })

        describe('#on_error()', function() {

            it('should be called when judgement not match', function() {
                const instance = new FormBody<{ a: string | number, b: string }>(content)
                expect(() => instance.ensure('a', Jtl.string)).to.not.throw()
                expect(() => instance.ensure('a', Jtl.number)).to.throw('Body parameter of [a] does not match the rule: [is number]')
            })

            it('should be use custom on_error function if given', function() {
                const instance = new FormBody<{ a: string | number, b: string }>(content)
                expect(() => instance.ensure('a', Jtl.number, (prop, desc) => `${prop} -> ${desc.rule}`))
                    .to.throw('a -> is number')
            })
        })
    })
})
