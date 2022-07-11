/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { Jtl, Matcher } from './matcher'

chai.use(cap)

describe('matcher.ts', function() {

    let matcher: Matcher<boolean>

    before(function() {
        matcher = new Matcher<boolean>('is boolean', (target: any) => typeof target === 'boolean')
    })

    after(async function() {
    })

    describe('Matcher', function() {
        it('could new instance', function() {
            expect(matcher).to.be.instanceof(Matcher)
        })
    })

    describe('namespace Jtl', function() {

        describe('#mismatch()', function() {
            it('should check as given function', function() {
                expect(matcher.mismatch('asd')).to.have.property('rule')
                expect(matcher.mismatch(123)).to.have.property('rule')
                expect(matcher.mismatch(true)).to.be.undefined
                expect(matcher.mismatch(false)).to.be.undefined
            })
        })

        describe('#some()', function() {
            it('should check as given function', function() {
                expect(Jtl.some(Jtl.array, Jtl.number).mismatch('asd')).to.have.property('rule')
                expect(Jtl.some(Jtl.equal(123), Jtl.non_zero_number).mismatch('asd')).to.have.property('rule')
                expect(Jtl.some(Jtl.string, Jtl.number).mismatch('asd')).to.be.undefined
                expect(Jtl.some(Jtl.string, /asd/).mismatch('asd')).to.be.undefined
            })
        })

        describe('#every()', function() {
            it('should check as given function', function() {
                expect(Jtl.every(Jtl.array, Jtl.number).mismatch('asd')).to.have.property('rule')
                expect(Jtl.every(Jtl.equal(4523), Jtl.non_zero_number).mismatch('asd')).to.have.property('rule')
                expect(Jtl.every(Jtl.string, /12351/).mismatch('asd')).to.have.property('rule')
                expect(Jtl.every(Jtl.string, /asd/).mismatch('asd')).to.be.undefined
            })
        })

        describe('#$gt()', function() {
            it('should check value if greater than given one', function() {
                expect(Jtl.$gt(123).mismatch('asd')).to.have.property('rule')
                expect(Jtl.$gt(123).mismatch(50)).to.have.property('rule')
                expect(Jtl.$gt(123).mismatch(123)).to.have.property('rule')
                expect(Jtl.$gt(123).mismatch(254)).to.be.undefined
            })
        })

        describe('#$ge()', function() {
            it('should check value if greater than or equal to given one', function() {
                expect(Jtl.$ge(123).mismatch('asd')).to.have.property('rule')
                expect(Jtl.$ge(123).mismatch(50)).to.have.property('rule')
                expect(Jtl.$ge(123).mismatch(123)).to.be.undefined
                expect(Jtl.$ge(123).mismatch(254)).to.be.undefined
            })
        })

        describe('#$lt()', function() {
            it('should check value if less than given one', function() {
                expect(Jtl.$lt(123).mismatch('asd')).to.have.property('rule')
                expect(Jtl.$lt(123).mismatch(50)).to.be.undefined
                expect(Jtl.$lt(123).mismatch(123)).to.have.property('rule')
                expect(Jtl.$lt(123).mismatch(254)).to.have.property('rule')
            })
        })

        describe('#$le()', function() {
            it('should check value if less than or equal to given one', function() {
                expect(Jtl.$le(123).mismatch('asd')).to.have.property('rule')
                expect(Jtl.$le(123).mismatch(50)).to.be.undefined
                expect(Jtl.$le(123).mismatch(123)).to.be.undefined
                expect(Jtl.$le(123).mismatch(254)).to.have.property('rule')
            })
        })

        describe('#$eq()', function() {
            it('should check value if equal to given one', function() {
                expect(Jtl.$eq(123).mismatch('asd')).to.have.property('rule')
                expect(Jtl.$eq(123).mismatch(50)).to.have.property('rule')
                expect(Jtl.$eq(123).mismatch(123)).to.be.undefined
                expect(Jtl.$eq(123).mismatch(254)).to.have.property('rule')
            })
        })

        describe('#$ne()', function() {
            it('should check value if not equal to given one', function() {
                expect(Jtl.$ne(123).mismatch('asd')).to.have.property('rule')
                expect(Jtl.$ne(123).mismatch(50)).to.be.undefined
                expect(Jtl.$ne(123).mismatch(123)).to.have.property('rule')
                expect(Jtl.$ne(123).mismatch(254)).to.be.undefined
            })
        })

        describe('#$btw()', function() {
            it('should check value if between given range', function() {
                expect(Jtl.$btw(10, 100).mismatch('asd')).to.have.property('rule')
                expect(Jtl.$btw(10, 100).mismatch(50)).to.be.undefined
                expect(Jtl.$btw(10, 100).mismatch(100)).to.be.undefined
                expect(Jtl.$btw(10, 100).mismatch(123)).to.have.property('rule')
            })
        })

        describe('#$mx()', function() {
            it('should check value if has given factor', function() {
                expect(Jtl.$mx(3).mismatch('asd')).to.have.property('rule')
                expect(Jtl.$mx(3).mismatch(50)).to.have.property('rule')
                expect(Jtl.$mx(3).mismatch(100)).to.have.property('rule')
                expect(Jtl.$mx(3).mismatch(123)).to.be.undefined
            })
        })

        describe('#array_of()', function() {
            it('should check value if has given factor', function() {
                expect(Jtl.array_of(Jtl.string).mismatch([123, 3, 45])).to.have.property('rule')
                expect(Jtl.array_of(Jtl.some(Jtl.string, Jtl.number)).mismatch([123, 3, 45])).to.be.undefined
                expect(Jtl.array_of(/look/).mismatch(['he looks like', 'look at', 'look out'])).to.be.undefined
                expect(Jtl.array_of(/look/).mismatch(['look', 'sleep', 'as'])).to.have.property('rule')
            })
        })

        describe('#property()', function() {
            it('should check value if has given factor', function() {
                expect(Jtl.property('a', Jtl.string).mismatch({ b: '123' })).to.have.property('rule')
                expect(Jtl.property('a', Jtl.string).mismatch({ a: 123 })).to.have.property('rule')
                expect(Jtl.property('a', Jtl.string).mismatch({ a: '123' })).to.be.undefined
            })
        })

        describe('#$in()', function() {
            it('should check value if included by given sequence', function() {
                expect(Jtl.$in([50, 100]).mismatch('asd')).to.have.property('rule')
                expect(Jtl.$in([50, 100]).mismatch(50)).to.be.undefined
                expect(Jtl.$in([50, 100]).mismatch(100)).to.be.undefined
                expect(Jtl.$in([50, 100]).mismatch(123)).to.have.property('rule')
            })
        })

        describe('#exist', function() {
            it('should check value if exists', function() {
                expect(Jtl.exist.mismatch('asd')).to.be.undefined
                expect(Jtl.exist.mismatch(null)).to.be.undefined
                expect(Jtl.exist.mismatch(undefined)).to.have.property('rule')
            })
        })

        describe('#is_function', function() {
            it('should check value if is a function', function() {
                expect(Jtl.is_function.mismatch(null)).to.have.property('rule')
                expect(Jtl.is_function.mismatch('asd')).to.have.property('rule')
                expect(Jtl.is_function.mismatch(undefined)).to.have.property('rule')
                expect(Jtl.is_function.mismatch(() => 'true')).to.be.undefined
                expect(Jtl.is_function.mismatch(function() {
                    return 'some thing'
                })).to.be.undefined
            })
        })

        describe('#object', function() {
            it('should check value if is a object', function() {
                expect(Jtl.object.mismatch({})).to.be.undefined
                expect(Jtl.object.mismatch('asd')).to.have.property('rule')
                expect(Jtl.every(
                    Jtl.object,
                    Jtl.property('a', Jtl.string),
                    Jtl.property('b', Jtl.number),
                ).mismatch({ a: '123', b: 13 })).to.be.undefined
                expect(Jtl.every(
                    Jtl.object,
                    Jtl.property('a', Jtl.string),
                    Jtl.property('b', Jtl.number),
                ).mismatch({ a: 123, b: 'aa' })).to.have.property('rule')
            })
        })

        describe('#array', function() {
            it('should check value is an array', function() {
                expect(Jtl.array.mismatch('asd')).to.have.property('rule')
                expect(Jtl.array.mismatch([])).to.be.undefined
                expect(Jtl.array.mismatch(['asd'])).to.be.undefined
            })
        })

        describe('#non_empty_array', function() {
            it('should check value is an array and not empty', function() {
                expect(Jtl.non_empty_array.mismatch('asd')).to.have.property('rule')
                expect(Jtl.non_empty_array.mismatch([])).to.have.property('rule')
                expect(Jtl.non_empty_array.mismatch(['asd'])).to.be.undefined
            })
        })

        describe('#is_null', function() {
            it('should check value is null', function() {
                expect(Jtl.is_null.mismatch(null)).to.be.undefined
                expect(Jtl.is_null.mismatch('asd')).to.have.property('rule')
                expect(Jtl.is_null.mismatch([])).to.have.property('rule')
                expect(Jtl.is_null.mismatch(['asd'])).to.have.property('rule')
            })
        })

        describe('#is_void', function() {
            it('should check value is null', function() {
                expect(Jtl.is_void.mismatch(undefined)).to.be.undefined
                expect(Jtl.is_void.mismatch('asd')).to.have.property('rule')
                expect(Jtl.is_void.mismatch([])).to.have.property('rule')
                expect(Jtl.is_void.mismatch(['asd'])).to.have.property('rule')
            })
        })

        describe('#string', function() {
            it('should check value if is string', function() {
                expect(Jtl.string.mismatch(null)).to.have.property('rule')
                expect(Jtl.string.mismatch('asd')).to.be.undefined
                expect(Jtl.string.mismatch('')).to.be.undefined
                expect(Jtl.string.mismatch([])).to.have.property('rule')
                expect(Jtl.string.mismatch(['asd'])).to.have.property('rule')
            })
        })

        describe('#non_empty_string', function() {
            it('should check value if is string and not empty', function() {
                expect(Jtl.non_empty_string.mismatch(null)).to.have.property('rule')
                expect(Jtl.non_empty_string.mismatch('asd')).to.be.undefined
                expect(Jtl.non_empty_string.mismatch('')).to.have.property('rule')
                expect(Jtl.non_empty_string.mismatch([])).to.have.property('rule')
                expect(Jtl.non_empty_string.mismatch(['asd'])).to.have.property('rule')
            })
        })

        describe('#number', function() {
            it('should check value if is number', function() {
                expect(Jtl.number.mismatch(null)).to.have.property('rule')
                expect(Jtl.number.mismatch('asd')).to.have.property('rule')
                expect(Jtl.number.mismatch('')).to.have.property('rule')
                expect(Jtl.number.mismatch(123)).to.be.undefined
                expect(Jtl.number.mismatch(0)).to.be.undefined
            })
        })

        describe('#non_zero_number', function() {
            it('should check value if is number and not zero', function() {
                expect(Jtl.non_zero_number.mismatch(null)).to.have.property('rule')
                expect(Jtl.non_zero_number.mismatch('asd')).to.have.property('rule')
                expect(Jtl.non_zero_number.mismatch('')).to.have.property('rule')
                expect(Jtl.non_zero_number.mismatch(123)).to.be.undefined
                expect(Jtl.non_zero_number.mismatch(0)).to.have.property('rule')
            })
        })

        describe('#boolean', function() {
            it('should check value if is a boolean', function() {
                expect(Jtl.boolean.mismatch(true)).to.be.undefined
                expect(Jtl.boolean.mismatch(false)).to.be.undefined
                expect(Jtl.boolean.mismatch('asd')).to.have.property('rule')
                expect(Jtl.boolean.mismatch(123)).to.have.property('rule')
            })
        })

        describe('#is_true', function() {
            it('should check value is true', function() {
                expect(Jtl.is_true.mismatch(true)).to.be.undefined
                expect(Jtl.is_true.mismatch(false)).to.have.property('rule')
                expect(Jtl.is_true.mismatch('asd')).to.have.property('rule')
                expect(Jtl.is_true.mismatch(123)).to.have.property('rule')
            })
        })

        describe('#is_false', function() {
            it('should check value is false', function() {
                expect(Jtl.is_false.mismatch(true)).to.have.property('rule')
                expect(Jtl.is_false.mismatch(false)).to.be.undefined
                expect(Jtl.is_false.mismatch('asd')).to.have.property('rule')
                expect(Jtl.is_false.mismatch(123)).to.have.property('rule')
            })
        })
    })
})
