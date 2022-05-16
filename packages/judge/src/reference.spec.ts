import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { Reference } from './reference'

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

describe('reference.ts', function() {

    let ref: Reference<ExType>

    before(function() {
    })

    after(async function() {
    })

    describe('Reference', function() {
        it('could new instance', function() {
            ref = new Reference<ExType>({
                a: 'some string',
                b: 123,
                c: {
                    c1: 'another string',
                    c2: 9,
                    c3: false,
                }
            })
            expect(ref).to.be.instanceof(Reference)
            const ref_m = new Reference(undefined)
            expect(ref_m).to.be.instanceof(Reference)
        })

        describe('#get', function() {
            it('should get value of specified path', function() {
                expect(ref.get('a')).to.equal('some string')
                expect(ref.get('b')).to.equal(123)
                expect(ref.get('bi')).to.be.undefined
                expect(ref.get('c.c1')).to.equal('another string')
                expect(ref.get('c.c2')).to.equal(9)
                expect(ref.get('c.c3')).to.equal(false)
                expect(ref.get('ci.c3')).to.equal(undefined)
            })

            it('should return whole object of data', function() {
                expect(ref.get()).to.have.property('a', 'some string')
                expect(ref.get()).to.have.property('b', 123)
            })
        })
    })
})
