import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { Jtl, Matcher } from './matcher'

chai.use(cap)

describe('Matcher', function() {

    const matcher = new Matcher<boolean>((target: any) => typeof target === 'boolean')

    before(function() {
    })

    after(async function() {
    })

    describe('new Matcher()', function() {
        expect(matcher).to.be.instanceof(Matcher)
    })

    describe('Matcher.check()', function() {
        expect(matcher.check('asd')).to.be.false
        expect(matcher.check(123)).to.be.false
        expect(matcher.check(true)).to.be.true
        expect(matcher.check(false)).to.be.true
    })

    describe('Jtl.$gt()', function() {
        expect(Jtl.$gt(123).check('asd')).to.be.false
        expect(Jtl.$gt(123).check(50)).to.be.false
        expect(Jtl.$gt(123).check(123)).to.be.false
        expect(Jtl.$gt(123).check(254)).to.be.true
    })

    describe('Jtl.$ge()', function() {
        expect(Jtl.$ge(123).check('asd')).to.be.false
        expect(Jtl.$ge(123).check(50)).to.be.false
        expect(Jtl.$ge(123).check(123)).to.be.true
        expect(Jtl.$ge(123).check(254)).to.be.true
    })

    describe('Jtl.$lt()', function() {
        expect(Jtl.$lt(123).check('asd')).to.be.false
        expect(Jtl.$lt(123).check(50)).to.be.true
        expect(Jtl.$lt(123).check(123)).to.be.false
        expect(Jtl.$lt(123).check(254)).to.be.false
    })

    describe('Jtl.$le()', function() {
        expect(Jtl.$le(123).check('asd')).to.be.false
        expect(Jtl.$le(123).check(50)).to.be.true
        expect(Jtl.$le(123).check(123)).to.be.true
        expect(Jtl.$le(123).check(254)).to.be.false
    })

    describe('Jtl.$eq()', function() {
        expect(Jtl.$eq(123).check('asd')).to.be.false
        expect(Jtl.$eq(123).check(50)).to.be.false
        expect(Jtl.$eq(123).check(123)).to.be.true
        expect(Jtl.$eq(123).check(254)).to.be.false
    })

    describe('Jtl.$ne()', function() {
        expect(Jtl.$ne(123).check('asd')).to.be.false
        expect(Jtl.$ne(123).check(50)).to.be.true
        expect(Jtl.$ne(123).check(123)).to.be.false
        expect(Jtl.$ne(123).check(254)).to.be.true
    })

    describe('Jtl.$btw()', function() {
        expect(Jtl.$btw(10, 100).check('asd')).to.be.false
        expect(Jtl.$btw(10, 100).check(50)).to.be.true
        expect(Jtl.$btw(10, 100).check(100)).to.be.true
        expect(Jtl.$btw(10, 100).check(123)).to.be.false
    })

    describe('Jtl.$mx()', function() {
        expect(Jtl.$mx(3).check('asd')).to.be.false
        expect(Jtl.$mx(3).check(50)).to.be.false
        expect(Jtl.$mx(3).check(100)).to.be.false
        expect(Jtl.$mx(3).check(123)).to.be.true
    })

    describe('Jtl.$in()', function() {
        expect(Jtl.$in([50, 100]).check('asd')).to.be.false
        expect(Jtl.$in([50, 100]).check(50)).to.be.true
        expect(Jtl.$in([50, 100]).check(100)).to.be.true
        expect(Jtl.$in([50, 100]).check(123)).to.be.false
    })
})
