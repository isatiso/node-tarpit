import { describe, it, expect, beforeAll } from 'vitest'
import { Jtl, Matcher } from './matcher'

describe('matcher.ts', function() {

    let matcher: Matcher<boolean>

    beforeAll(function() {
        matcher = new Matcher<boolean>('is boolean', (target: any) => typeof target === 'boolean')
    })

    describe('Matcher', function() {
        it('could new instance', function() {
            expect(matcher).toBeInstanceOf(Matcher)
        })
    })

    describe('namespace Jtl', function() {

        describe('#mismatch()', function() {
            it('should check as given function', function() {
                expect(matcher.mismatch('asd')).toHaveProperty('rule')
                expect(matcher.mismatch(123)).toHaveProperty('rule')
                expect(matcher.mismatch(true)).toBeUndefined()
                expect(matcher.mismatch(false)).toBeUndefined()
            })
        })

        describe('#some()', function() {
            it('should check as given function', function() {
                expect(Jtl.some(Jtl.array, Jtl.number).mismatch('asd')).toHaveProperty('rule')
                expect(Jtl.some(Jtl.equal(123), Jtl.non_zero_number).mismatch('asd')).toHaveProperty('rule')
                expect(Jtl.some(Jtl.string, Jtl.number).mismatch('asd')).toBeUndefined()
                expect(Jtl.some(Jtl.string, /asd/).mismatch('asd')).toBeUndefined()
            })
        })

        describe('#every()', function() {
            it('should check as given function', function() {
                expect(Jtl.every(Jtl.array, Jtl.number).mismatch('asd')).toHaveProperty('rule')
                expect(Jtl.every(Jtl.equal(4523), Jtl.non_zero_number).mismatch('asd')).toHaveProperty('rule')
                expect(Jtl.every(Jtl.string, /12351/).mismatch('asd')).toHaveProperty('rule')
                expect(Jtl.every(Jtl.string, /asd/).mismatch('asd')).toBeUndefined()
            })
        })

        describe('#$gt()', function() {
            it('should check value if greater than given one', function() {
                expect(Jtl.$gt(123).mismatch('asd')).toHaveProperty('rule')
                expect(Jtl.$gt(123).mismatch(50)).toHaveProperty('rule')
                expect(Jtl.$gt(123).mismatch(123)).toHaveProperty('rule')
                expect(Jtl.$gt(123).mismatch(254)).toBeUndefined()
            })
        })

        describe('#$ge()', function() {
            it('should check value if greater than or equal to given one', function() {
                expect(Jtl.$ge(123).mismatch('asd')).toHaveProperty('rule')
                expect(Jtl.$ge(123).mismatch(50)).toHaveProperty('rule')
                expect(Jtl.$ge(123).mismatch(123)).toBeUndefined()
                expect(Jtl.$ge(123).mismatch(254)).toBeUndefined()
            })
        })

        describe('#$lt()', function() {
            it('should check value if less than given one', function() {
                expect(Jtl.$lt(123).mismatch('asd')).toHaveProperty('rule')
                expect(Jtl.$lt(123).mismatch(50)).toBeUndefined()
                expect(Jtl.$lt(123).mismatch(123)).toHaveProperty('rule')
                expect(Jtl.$lt(123).mismatch(254)).toHaveProperty('rule')
            })
        })

        describe('#$le()', function() {
            it('should check value if less than or equal to given one', function() {
                expect(Jtl.$le(123).mismatch('asd')).toHaveProperty('rule')
                expect(Jtl.$le(123).mismatch(50)).toBeUndefined()
                expect(Jtl.$le(123).mismatch(123)).toBeUndefined()
                expect(Jtl.$le(123).mismatch(254)).toHaveProperty('rule')
            })
        })

        describe('#$eq()', function() {
            it('should check value if equal to given one', function() {
                expect(Jtl.$eq(123).mismatch('asd')).toHaveProperty('rule')
                expect(Jtl.$eq(123).mismatch(50)).toHaveProperty('rule')
                expect(Jtl.$eq(123).mismatch(123)).toBeUndefined()
                expect(Jtl.$eq(123).mismatch(254)).toHaveProperty('rule')
            })
        })

        describe('#$ne()', function() {
            it('should check value if not equal to given one', function() {
                expect(Jtl.$ne(123).mismatch('asd')).toHaveProperty('rule')
                expect(Jtl.$ne(123).mismatch(50)).toBeUndefined()
                expect(Jtl.$ne(123).mismatch(123)).toHaveProperty('rule')
                expect(Jtl.$ne(123).mismatch(254)).toBeUndefined()
            })
        })

        describe('#$btw()', function() {
            it('should check value if between given range', function() {
                expect(Jtl.$btw(10, 100).mismatch('asd')).toHaveProperty('rule')
                expect(Jtl.$btw(10, 100).mismatch(50)).toBeUndefined()
                expect(Jtl.$btw(10, 100).mismatch(100)).toBeUndefined()
                expect(Jtl.$btw(10, 100).mismatch(123)).toHaveProperty('rule')
            })
        })

        describe('#$mx()', function() {
            it('should check value if has given factor', function() {
                expect(Jtl.$mx(3).mismatch('asd')).toHaveProperty('rule')
                expect(Jtl.$mx(3).mismatch(50)).toHaveProperty('rule')
                expect(Jtl.$mx(3).mismatch(100)).toHaveProperty('rule')
                expect(Jtl.$mx(3).mismatch(123)).toBeUndefined()
            })
        })

        describe('#array_of()', function() {
            it('should check value if has given factor', function() {
                expect(Jtl.array_of(Jtl.string).mismatch([123, 3, 45])).toHaveProperty('rule')
                expect(Jtl.array_of(Jtl.some(Jtl.string, Jtl.number)).mismatch([123, 3, 45])).toBeUndefined()
                expect(Jtl.array_of(/look/).mismatch(['he looks like', 'look at', 'look out'])).toBeUndefined()
                expect(Jtl.array_of(/look/).mismatch(['look', 'sleep', 'as'])).toHaveProperty('rule')
            })
        })

        describe('#property()', function() {
            it('should check value if has given factor', function() {
                expect(Jtl.property('a', Jtl.string).mismatch({ b: '123' })).toHaveProperty('rule')
                expect(Jtl.property('a', Jtl.string).mismatch({ a: 123 })).toHaveProperty('rule')
                expect(Jtl.property('a', Jtl.string).mismatch({ a: '123' })).toBeUndefined()
            })
        })

        describe('#$in()', function() {
            it('should check value if included by given sequence', function() {
                expect(Jtl.$in([50, 100]).mismatch('asd')).toHaveProperty('rule')
                expect(Jtl.$in([50, 100]).mismatch(50)).toBeUndefined()
                expect(Jtl.$in([50, 100]).mismatch(100)).toBeUndefined()
                expect(Jtl.$in([50, 100]).mismatch(123)).toHaveProperty('rule')
            })
        })

        describe('#exist', function() {
            it('should check value if exists', function() {
                expect(Jtl.exist.mismatch('asd')).toBeUndefined()
                expect(Jtl.exist.mismatch(null)).toBeUndefined()
                expect(Jtl.exist.mismatch(undefined)).toHaveProperty('rule')
            })
        })

        describe('#is_function', function() {
            it('should check value if is a function', function() {
                expect(Jtl.is_function.mismatch(null)).toHaveProperty('rule')
                expect(Jtl.is_function.mismatch('asd')).toHaveProperty('rule')
                expect(Jtl.is_function.mismatch(undefined)).toHaveProperty('rule')
                expect(Jtl.is_function.mismatch(() => 'true')).toBeUndefined()
                expect(Jtl.is_function.mismatch(function() {
                    return 'some thing'
                })).toBeUndefined()
            })
        })

        describe('#object_of()', function() {
            it('should check value if the target type match the given', function() {
                expect(Jtl.object_of({ a: Jtl.string, b: Jtl.number }).mismatch({ a: 1, b: 2 })).toHaveProperty('rule')
                expect(Jtl.object_of({ a: Jtl.string, b: Jtl.number }).mismatch({ a: '1', b: 2 })).toBeUndefined()
                expect(Jtl.object_of({ a: Jtl.string, b: /^abc/ }).mismatch({ a: '1', b: 'ab' })).toHaveProperty('rule')
                expect(Jtl.object_of({ a: Jtl.string, b: /^abc/ }).mismatch({ a: '1', b: 'abc_lkj' })).toBeUndefined()
                expect(Jtl.object_of({ a: Jtl.string, b: /^abc/ }).mismatch(0)).toHaveProperty('rule')
                expect(Jtl.object_of({ a: Jtl.string, b: Jtl.boolean }).mismatch({ a: '1', b: 'abc_lkj' })).toHaveProperty('rule')
                expect(Jtl.object_of({ a: Jtl.string, b: Jtl.number }).mismatch(undefined)).toHaveProperty('rule')
            })
        })

        describe('#object', function() {
            it('should check value if is a object', function() {
                expect(Jtl.object.mismatch({})).toBeUndefined()
                expect(Jtl.object.mismatch('asd')).toHaveProperty('rule')
                expect(Jtl.every(
                    Jtl.object,
                    Jtl.property('a', Jtl.string),
                    Jtl.property('b', Jtl.number),
                ).mismatch({ a: '123', b: 13 })).toBeUndefined()
                expect(Jtl.every(
                    Jtl.object,
                    Jtl.property('a', Jtl.string),
                    Jtl.property('b', Jtl.number),
                ).mismatch({ a: 123, b: 'aa' })).toHaveProperty('rule')
            })
        })

        describe('#array', function() {
            it('should check value is an array', function() {
                expect(Jtl.array.mismatch('asd')).toHaveProperty('rule')
                expect(Jtl.array.mismatch([])).toBeUndefined()
                expect(Jtl.array.mismatch(['asd'])).toBeUndefined()
            })
        })

        describe('#non_empty_array', function() {
            it('should check value is an array and not empty', function() {
                expect(Jtl.non_empty_array.mismatch('asd')).toHaveProperty('rule')
                expect(Jtl.non_empty_array.mismatch([])).toHaveProperty('rule')
                expect(Jtl.non_empty_array.mismatch(['asd'])).toBeUndefined()
            })
        })

        describe('#is_null', function() {
            it('should check value is null', function() {
                expect(Jtl.is_null.mismatch(null)).toBeUndefined()
                expect(Jtl.is_null.mismatch('asd')).toHaveProperty('rule')
                expect(Jtl.is_null.mismatch([])).toHaveProperty('rule')
                expect(Jtl.is_null.mismatch(['asd'])).toHaveProperty('rule')
            })
        })

        describe('#is_void', function() {
            it('should check value is null', function() {
                expect(Jtl.is_void.mismatch(undefined)).toBeUndefined()
                expect(Jtl.is_void.mismatch('asd')).toHaveProperty('rule')
                expect(Jtl.is_void.mismatch([])).toHaveProperty('rule')
                expect(Jtl.is_void.mismatch(['asd'])).toHaveProperty('rule')
            })
        })

        describe('#string', function() {
            it('should check value if is string', function() {
                expect(Jtl.string.mismatch(null)).toHaveProperty('rule')
                expect(Jtl.string.mismatch('asd')).toBeUndefined()
                expect(Jtl.string.mismatch('')).toBeUndefined()
                expect(Jtl.string.mismatch([])).toHaveProperty('rule')
                expect(Jtl.string.mismatch(['asd'])).toHaveProperty('rule')
            })
        })

        describe('#non_empty_string', function() {
            it('should check value if is string and not empty', function() {
                expect(Jtl.non_empty_string.mismatch(null)).toHaveProperty('rule')
                expect(Jtl.non_empty_string.mismatch('asd')).toBeUndefined()
                expect(Jtl.non_empty_string.mismatch('')).toHaveProperty('rule')
                expect(Jtl.non_empty_string.mismatch([])).toHaveProperty('rule')
                expect(Jtl.non_empty_string.mismatch(['asd'])).toHaveProperty('rule')
            })
        })

        describe('#number', function() {
            it('should check value if is number', function() {
                expect(Jtl.number.mismatch(null)).toHaveProperty('rule')
                expect(Jtl.number.mismatch('asd')).toHaveProperty('rule')
                expect(Jtl.number.mismatch('')).toHaveProperty('rule')
                expect(Jtl.number.mismatch(123)).toBeUndefined()
                expect(Jtl.number.mismatch(0)).toBeUndefined()
            })
        })

        describe('#non_zero_number', function() {
            it('should check value if is number and not zero', function() {
                expect(Jtl.non_zero_number.mismatch(null)).toHaveProperty('rule')
                expect(Jtl.non_zero_number.mismatch('asd')).toHaveProperty('rule')
                expect(Jtl.non_zero_number.mismatch('')).toHaveProperty('rule')
                expect(Jtl.non_zero_number.mismatch(123)).toBeUndefined()
                expect(Jtl.non_zero_number.mismatch(0)).toHaveProperty('rule')
            })
        })

        describe('#boolean', function() {
            it('should check value if is a boolean', function() {
                expect(Jtl.boolean.mismatch(true)).toBeUndefined()
                expect(Jtl.boolean.mismatch(false)).toBeUndefined()
                expect(Jtl.boolean.mismatch('asd')).toHaveProperty('rule')
                expect(Jtl.boolean.mismatch(123)).toHaveProperty('rule')
            })
        })

        describe('#is_true', function() {
            it('should check value is true', function() {
                expect(Jtl.is_true.mismatch(true)).toBeUndefined()
                expect(Jtl.is_true.mismatch(false)).toHaveProperty('rule')
                expect(Jtl.is_true.mismatch('asd')).toHaveProperty('rule')
                expect(Jtl.is_true.mismatch(123)).toHaveProperty('rule')
            })
        })

        describe('#is_false', function() {
            it('should check value is false', function() {
                expect(Jtl.is_false.mismatch(true)).toHaveProperty('rule')
                expect(Jtl.is_false.mismatch(false)).toBeUndefined()
                expect(Jtl.is_false.mismatch('asd')).toHaveProperty('rule')
                expect(Jtl.is_false.mismatch(123)).toHaveProperty('rule')
            })
        })
    })
})
