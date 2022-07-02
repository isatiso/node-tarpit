/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { Judgement } from './judgement'
import { Jtl } from './matcher'

chai.use(cap)

type ExType = {
    a: string
    b: number
    bi?: number
    c: {
        c1: string
        c2: number
        c3: boolean
    }
    ci?: {
        c1: string
        c2: number
        c3: boolean
    }
}

describe('judgement.ts', function() {

    let judge: Judgement<ExType>

    before(function() {
    })

    after(async function() {
    })

    describe('Judgement', function() {
        it('could new instance', function() {
            judge = new Judgement<ExType>({
                a: 'some string',
                b: 123,
                c: {
                    c1: '',
                    c2: 9,
                    c3: false,
                }
            })
            expect(judge).to.be.instanceof(Judgement)
        })

        describe('#getIf', function() {
            it('should get value of specified path if match given rule', function() {
                expect(judge.get_if('a', Jtl.string)).not.to.be.undefined
                expect(judge.get_if('a', Jtl.some(Jtl.string, /asd/))).not.to.be.undefined
                expect(judge.get_if('a', Jtl.every(Jtl.string, /asd/))).to.be.undefined
                expect(judge.get_if('a', Jtl.non_empty_string)).not.to.be.undefined
                expect(judge.get_if('c.c1', Jtl.non_empty_string, 'lkj')).not.to.be.undefined
                expect(judge.get_if('a', /some [a-z]{1,8}/)).not.to.be.undefined
                expect(judge.get_if('a', /some thing/)).to.be.undefined
                expect(judge.get_if('a', /some thing/, 'lkj')).not.to.be.undefined
                expect(judge.get_if('c', Jtl.every(
                    Jtl.object,
                    Jtl.property('c1', Jtl.string),
                    Jtl.property('c2', Jtl.number),
                ))).not.to.be.undefined
            })
        })
    })
})
