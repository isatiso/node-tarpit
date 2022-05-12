import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { Jtl, Matcher } from './matcher'

chai.use(cap)

describe('matcher.ts', function() {

    let matcher: Matcher<boolean>

    before(function() {
    })

    after(async function() {
    })

    describe('class Matcher', function() {
        it('could new instance', function() {
            matcher = new Matcher<boolean>((target: any) => typeof target === 'boolean')
            expect(matcher).to.be.instanceof(Matcher)
        })
    })

    describe('namespace Jtl', function() {

        describe('#check()', function() {
            it('should check as given function', function() {
                expect(matcher.check('asd')).to.be.false
                expect(matcher.check(123)).to.be.false
                expect(matcher.check(true)).to.be.true
                expect(matcher.check(false)).to.be.true
            })
        })

        describe('#$gt()', function() {
            it('should check value if greater than given one', function() {
                expect(Jtl.$gt(123).check('asd')).to.be.false
                expect(Jtl.$gt(123).check(50)).to.be.false
                expect(Jtl.$gt(123).check(123)).to.be.false
                expect(Jtl.$gt(123).check(254)).to.be.true
            })
        })

        describe('#$ge()', function() {
            it('should check value if greater than or equal to given one', function() {
                expect(Jtl.$ge(123).check('asd')).to.be.false
                expect(Jtl.$ge(123).check(50)).to.be.false
                expect(Jtl.$ge(123).check(123)).to.be.true
                expect(Jtl.$ge(123).check(254)).to.be.true
            })
        })

        describe('#$lt()', function() {
            it('should check value if less than given one', function() {
                expect(Jtl.$lt(123).check('asd')).to.be.false
                expect(Jtl.$lt(123).check(50)).to.be.true
                expect(Jtl.$lt(123).check(123)).to.be.false
                expect(Jtl.$lt(123).check(254)).to.be.false
            })
        })

        describe('#$le()', function() {
            it('should check value if less than or equal to given one', function() {
                expect(Jtl.$le(123).check('asd')).to.be.false
                expect(Jtl.$le(123).check(50)).to.be.true
                expect(Jtl.$le(123).check(123)).to.be.true
                expect(Jtl.$le(123).check(254)).to.be.false
            })
        })

        describe('#$eq()', function() {
            it('should check value if equal to given one', function() {
                expect(Jtl.$eq(123).check('asd')).to.be.false
                expect(Jtl.$eq(123).check(50)).to.be.false
                expect(Jtl.$eq(123).check(123)).to.be.true
                expect(Jtl.$eq(123).check(254)).to.be.false
            })
        })

        describe('#$ne()', function() {
            it('should check value if not equal to given one', function() {
                expect(Jtl.$ne(123).check('asd')).to.be.false
                expect(Jtl.$ne(123).check(50)).to.be.true
                expect(Jtl.$ne(123).check(123)).to.be.false
                expect(Jtl.$ne(123).check(254)).to.be.true
            })
        })

        describe('#$btw()', function() {
            it('should check value if between given range', function() {
                expect(Jtl.$btw(10, 100).check('asd')).to.be.false
                expect(Jtl.$btw(10, 100).check(50)).to.be.true
                expect(Jtl.$btw(10, 100).check(100)).to.be.true
                expect(Jtl.$btw(10, 100).check(123)).to.be.false
            })
        })

        describe('#$mx()', function() {
            it('should check value if has given factor', function() {
                expect(Jtl.$mx(3).check('asd')).to.be.false
                expect(Jtl.$mx(3).check(50)).to.be.false
                expect(Jtl.$mx(3).check(100)).to.be.false
                expect(Jtl.$mx(3).check(123)).to.be.true
            })
        })

        describe('#$in()', function() {
            it('should check value if included by given sequence', function() {
                expect(Jtl.$in([50, 100]).check('asd')).to.be.false
                expect(Jtl.$in([50, 100]).check(50)).to.be.true
                expect(Jtl.$in([50, 100]).check(100)).to.be.true
                expect(Jtl.$in([50, 100]).check(123)).to.be.false
            })
        })

        describe('#exist', function() {
            it('should check value if exists', function() {
                expect(Jtl.exist.check('asd')).to.be.true
                expect(Jtl.exist.check(null)).to.be.true
                expect(Jtl.exist.check(undefined)).to.be.false
            })
        })

        describe('#isFunction', function() {
            it('should check value if is a function', function() {
                expect(Jtl.isFunction.check(null)).to.be.false
                expect(Jtl.isFunction.check('asd')).to.be.false
                expect(Jtl.isFunction.check(undefined)).to.be.false
                expect(Jtl.isFunction.check(() => 'true')).to.be.true
                expect(Jtl.isFunction.check(function() {
                    return 'some thing'
                })).to.be.true
            })
        })

        describe('#object', function() {
            it('should check value if is a object', function() {
                expect(Jtl.object.check({})).to.be.true
                expect(Jtl.object.check('asd')).to.be.false
            })
        })

        describe('#array', function() {
            it('should check value is an array', function() {
                expect(Jtl.array.check('asd')).to.be.false
                expect(Jtl.array.check([])).to.be.true
                expect(Jtl.array.check(['asd'])).to.be.true
            })
        })

        describe('#nonEmptyArray', function() {
            it('should check value is an array and not empty', function() {
                expect(Jtl.nonEmptyArray.check('asd')).to.be.false
                expect(Jtl.nonEmptyArray.check([])).to.be.false
                expect(Jtl.nonEmptyArray.check(['asd'])).to.be.true
            })
        })

        describe('#isNull', function() {
            it('should check value is null', function() {
                expect(Jtl.isNull.check(null)).to.be.true
                expect(Jtl.isNull.check('asd')).to.be.false
                expect(Jtl.isNull.check([])).to.be.false
                expect(Jtl.isNull.check(['asd'])).to.be.false
            })
        })

        describe('#string', function() {
            it('should check value if is string', function() {
                expect(Jtl.string.check(null)).to.be.false
                expect(Jtl.string.check('asd')).to.be.true
                expect(Jtl.string.check('')).to.be.true
                expect(Jtl.string.check([])).to.be.false
                expect(Jtl.string.check(['asd'])).to.be.false
            })
        })

        describe('#nonEmptyString', function() {
            it('should check value if is string and not empty', function() {
                expect(Jtl.nonEmptyString.check(null)).to.be.false
                expect(Jtl.nonEmptyString.check('asd')).to.be.true
                expect(Jtl.nonEmptyString.check('')).to.be.false
                expect(Jtl.nonEmptyString.check([])).to.be.false
                expect(Jtl.nonEmptyString.check(['asd'])).to.be.false
            })
        })

        describe('#number', function() {
            it('should check value if is number', function() {
                expect(Jtl.number.check(null)).to.be.false
                expect(Jtl.number.check('asd')).to.be.false
                expect(Jtl.number.check('')).to.be.false
                expect(Jtl.number.check(123)).to.be.true
                expect(Jtl.number.check(0)).to.be.true
            })
        })

        describe('#nonZeroNumber', function() {
            it('should check value if is number and not zero', function() {
                expect(Jtl.nonZeroNumber.check(null)).to.be.false
                expect(Jtl.nonZeroNumber.check('asd')).to.be.false
                expect(Jtl.nonZeroNumber.check('')).to.be.false
                expect(Jtl.nonZeroNumber.check(123)).to.be.true
                expect(Jtl.nonZeroNumber.check(0)).to.be.false
            })
        })

        describe('#boolean', function() {
            it('should check value if is a boolean', function() {
                expect(Jtl.boolean.check(true)).to.be.true
                expect(Jtl.boolean.check(false)).to.be.true
                expect(Jtl.boolean.check('asd')).to.be.false
                expect(Jtl.boolean.check(123)).to.be.false
            })
        })

        describe('#isTrue', function() {
            it('should check value is true', function() {
                expect(Jtl.isTrue.check(true)).to.be.true
                expect(Jtl.isTrue.check(false)).to.be.false
                expect(Jtl.isTrue.check('asd')).to.be.false
                expect(Jtl.isTrue.check(123)).to.be.false
            })
        })

        describe('#isFalse', function() {
            it('should check value is false', function() {
                expect(Jtl.isFalse.check(true)).to.be.false
                expect(Jtl.isFalse.check(false)).to.be.true
                expect(Jtl.isFalse.check('asd')).to.be.false
                expect(Jtl.isFalse.check(123)).to.be.false
            })
        })
    })
})
