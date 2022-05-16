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
                expect(judge.getIf('a', Jtl.string)).not.to.be.undefined
                expect(judge.getIf('a', Jtl.nonEmptyString)).not.to.be.undefined
                expect(judge.getIf('c.c1', Jtl.nonEmptyString, 'lkj')).not.to.be.undefined
                expect(judge.getIf('a', /some [a-z]{1,8}/)).not.to.be.undefined
                expect(judge.getIf('a', /some thing/)).to.be.undefined
                expect(judge.getIf('a', /some thing/, 'lkj')).not.to.be.undefined
            })
        })

        describe('#getIfAny', function() {
            it('should get value of specified path if match given rule', function() {
                expect(judge.getIfAny('a', [Jtl.string, Jtl.nonEmptyString])).not.to.be.undefined
                expect(judge.getIfAny('a', [/some [a-z]{1,8}/, /some thing/])).not.to.be.undefined
                expect(judge.getIfAny('a', [/some [a-z]{7,8}/, /some thing/])).to.be.undefined
                expect(judge.getIfAny('a', [/some [a-z]{7,8}/, /some thing/], 'default value')).to.equal('default value')
            })
        })

        describe('#getIfAll', function() {
            it('should get value of specified path if match given rule', function() {
                expect(judge.getIfAll('a', [Jtl.string, Jtl.nonEmptyString])).not.to.be.undefined
                expect(judge.getIfAll('a', [/some [a-z]{1,8}/, /some thing/])).to.be.undefined
                expect(judge.getIfAll('a', [/some [a-z]{1,8}/, /some thing/], 'default value')).to.equal('default value')
            })
        })
    })
})
