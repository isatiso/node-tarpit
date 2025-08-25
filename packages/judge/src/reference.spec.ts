import { describe, it, expect } from 'vitest'
import { Reference } from './reference'

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
            expect(ref).toBeInstanceOf(Reference)
            const ref_m = new Reference(undefined)
            expect(ref_m).toBeInstanceOf(Reference)
        })

        describe('.get', function() {
            it('should get value of specified path', function() {
                expect(ref.get('a')).toEqual('some string')
                expect(ref.get('b')).toEqual(123)
                expect(ref.get('bi')).toBeUndefined()
                expect(ref.get('c.c1')).toEqual('another string')
                expect(ref.get('c.c2')).toEqual(9)
                expect(ref.get('c.c3')).toEqual(false)
                expect(ref.get('ci.c3')).toEqual(undefined)
            })

            it('should return whole object of data', function() {
                expect(ref.get()).toHaveProperty('a', 'some string')
                expect(ref.get()).toHaveProperty('b', 123)
            })
        })
    })
})
