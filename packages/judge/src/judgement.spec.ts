import { describe, it, expect } from 'vitest'
import { Judgement } from './judgement'
import { Jtl } from './matcher'

type ExType = {
    a: string
    b: number
    bi?: number | undefined
    c: {
        c1: string
        c2: number
        c3?: boolean
    }
    ci?: {
        c1: string
        c2: number
        c3: boolean
    },
    cross: string | number
}

describe('judgement.ts', function() {

    let judge: Judgement<ExType>

    describe('Judgement', function() {
        it('could new instance', function() {
            judge = new Judgement<ExType>({
                a: 'some string',
                b: 123,
                c: {
                    c1: '',
                    c2: 9,
                    c3: false,
                },
                cross: 'lkj'
            })
            expect(judge).toBeInstanceOf(Judgement)
        })

        describe('.get_if', function() {
            it('should get value of specified path if match given rule', function() {
                expect(judge.get_if('a', Jtl.string)).not.toBeUndefined()
                expect(judge.get_if('a', Jtl.some(Jtl.string, /asd/))).not.toBeUndefined()
                expect(judge.get_if('a', Jtl.every(Jtl.string, /asd/))).toBeUndefined()
                expect(judge.get_if('a', Jtl.non_empty_string)).not.toBeUndefined()
                expect(judge.get_if('c.c1', Jtl.non_empty_string, 'lkj')).not.toBeUndefined()
                expect(judge.get_if('a', /some [a-z]{1,8}/)).not.toBeUndefined()
                expect(judge.get_if('a', /some thing/)).toBeUndefined()
                expect(judge.get_if('a', /some thing/, 'lkj')).not.toBeUndefined()
                expect(judge.get_if('c', Jtl.every(
                    Jtl.object,
                    Jtl.property('c1', Jtl.string),
                    Jtl.property('c2', Jtl.number),
                ))).not.toBeUndefined()
            })
        })

        describe('.ensure', function() {
            it('should get value of specified path if match given rule', function() {
                expect(judge.ensure('a', Jtl.string)).not.toBeUndefined()
                expect(judge.ensure('a', Jtl.some(Jtl.string, /asd/))).not.toBeUndefined()
                expect(judge.ensure('a', Jtl.non_empty_string)).not.toBeUndefined()
                expect(judge.ensure('a', /some [a-z]{1,8}/)).not.toBeUndefined()
                expect(judge.ensure('c', Jtl.every(
                    Jtl.object,
                    Jtl.property('c1', Jtl.string),
                    Jtl.property('c2', Jtl.number),
                ))).not.toBeUndefined()

                expect(() => judge.ensure('c.c1', Jtl.non_empty_string,)).toThrow()
                expect(() => judge.ensure('a', Jtl.every(Jtl.string, /asd/))).toThrow()
                expect(() => judge.ensure('a', /some thing/, (_prop, _desc) => {
                    throw new Error('specified message')
                })).toThrow('specified message')
            })
        })

        describe('.do_if', function() {
            it('should get value of specified path if match given rule', function() {
                let called = 0

                function do_something(_res: number | string | undefined) {
                    called++
                }

                judge.do_if('a', Jtl.string, do_something)
                expect(called).toEqual(1)
                judge.do_if('a', /asd/, do_something)
                expect(called).toEqual(1)
                judge.do_if('bi', Jtl.number, do_something)
                expect(called).toEqual(1)
            })
        })
    })
})
