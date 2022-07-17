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
import { Guard } from './guard'

chai.use(cap)

describe('guard.ts', function() {

    describe('Guard', function() {

        it('should new instance', function() {
            const instance = new Guard({ type: 'basic', credentials: 'YWxhZGRpbjpvcGVuc2VzYW1l' })
            expect(instance).to.be.instanceof(Judgement)
            expect(instance.data).to.eql({ type: 'basic', credentials: 'YWxhZGRpbjpvcGVuc2VzYW1l' })
        })

        describe('#on_error()', function() {

            it('should be called when judgement not match', function() {
                const instance = new Guard({ type: 'basic', credentials: 'YWxhZGRpbjpvcGVuc2VzYW1l' })
                expect(() => instance.ensure('type', /^basic$/)).to.not.throw()
                expect(() => instance.ensure('type', /^bearer$/)).to.throw('Token field [type] does not match the rule: [RegExp ^bearer$]')
            })

            it('should be use custom on_error function if given', function() {
                const instance = new Guard({ type: 'basic', credentials: 'YWxhZGRpbjpvcGVuc2VzYW1l' })
                expect(() => instance.ensure('type', /^user$/, (prop, desc) => `${prop} -> ${desc.rule}`))
                    .to.throw('type -> RegExp ^user$')
            })
        })
    })
})
