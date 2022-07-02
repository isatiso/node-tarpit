/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import {
    get_all_prop_decorator,
    get_class_decorator,
    get_class_parameter_decorator,
    get_method_parameter_decorator,
    get_param_types,
    get_prop_decorator,
    get_prop_types,
    make_abstract_decorator,
    make_decorator
} from './decorator'

chai.use(cap)

describe('decorator.ts', function() {

    const GrandpaDecorator = make_abstract_decorator('GrandpaDecorator')
    const ParentDecorator = make_abstract_decorator('ParentDecorator', GrandpaDecorator)
    const TestDecorator = make_decorator('TestDecorator', (a: string, b: number) => ({ a, b }), ParentDecorator)

    class P {
        constructor(_m: string) {
        }
    }

    @TestDecorator('a', 123)
    @TestDecorator('a', 123)
    class A {
        constructor(
            @TestDecorator('a', 123)
            @TestDecorator('a', 123)
                a: number,
            @TestDecorator('a', 123)
                b: string,
            _c: P) {
        }

        @TestDecorator('a', 123)
        @TestDecorator('a', 123)
        async m(
            a: string,
            b: string,
            @TestDecorator('a', 123)
                c: number,
            @TestDecorator('a', 123)
            @TestDecorator('a', 123)
                d: boolean,
        ) {

        }

        @TestDecorator('a', 123)
        d?: P = undefined
    }

    describe('make_decorator()', function() {

        it('should create decorator', function() {
            const D = make_decorator('D', (a: string, b: number) => ({ a, b }))
            expect(() => new D('asd', 1)).not.to.throw()
            const ins: InstanceType<typeof D> = new D('asd', 1)
            expect(ins).to.be.instanceof(D)
        })

        it('should create decorator with name', function() {
            const D = make_decorator('D', (a: string, b: number) => ({ a, b }))
            expect(D.name).to.equal('D')
        })

        it('should create inherited decorator', function() {
            expect(new TestDecorator('asd', 1)).to.be.instanceof(ParentDecorator)
        })
    })

    describe('make_abstract_decorator()', function() {
        it('should not be called', function() {
            expect(() => (ParentDecorator as any)()).to.throw('Abstract decorator can\'t be called directly')
        })
    })

    describe('get_class_decorator()', function() {
        it('should get decorators of class', function() {
            const decorators = get_class_decorator(A)
            expect(decorators).to.have.length(2)
            expect(decorators[0]).to.be.instanceof(TestDecorator)
        })

        it('should return empty array if no decorator exist', function() {
            const decorators = get_class_decorator(P)
            expect(decorators).to.eql([])
        })

        it('should throw errors if not given class', function() {
            expect(() => get_class_decorator({})).to.throw('[object Object] is not constructor.')
        })
    })

    describe('get_class_parameter_decorator()', function() {
        it('should get constructor parameter decorators of class', function() {
            const decorators = get_class_parameter_decorator(A)
            expect(decorators).to.have.length(2)
            expect(decorators[0]).to.have.length(2)
            expect(decorators[1]).to.have.length(1)
            expect(decorators[0][0]).to.be.instanceof(TestDecorator)
        })

        it('should return empty array if no parameter decorator exist', function() {
            const decorators = get_class_parameter_decorator(P)
            expect(decorators).to.eql([])
        })

        it('should throw errors if not given class', function() {
            expect(() => get_class_parameter_decorator({})).to.throw('[object Object] is not constructor.')
        })
    })

    describe('get_all_prop_decorator()', function() {
        it('should get all decorators of class property', function() {
            const decorators = get_all_prop_decorator(A)
            expect(decorators?.size).to.equal(2)
            expect(decorators?.get('m')).to.have.length(2)
            expect(decorators?.get('m')?.[0]).to.be.instanceof(TestDecorator)
        })

        it('should throw errors if not given class', function() {
            expect(() => get_all_prop_decorator({})).to.throw('[object Object] is not constructor.')
        })
    })

    describe('get_prop_decorator()', function() {
        it('should get decorators of specified property', function() {
            const decorators = get_prop_decorator(A, 'm')
            expect(decorators).to.have.length(2)
            expect(decorators[0]).to.be.instanceof(TestDecorator)
        })

        it('should return empty array if no property decorator exist', function() {
            const decorators = get_prop_decorator(P, 'm')
            expect(decorators).to.eql([])
        })

        it('should throw errors if not given class', function() {
            expect(() => get_prop_decorator({}, 'm')).to.throw('[object Object] is not constructor.')
        })
    })

    describe('get_method_parameter_decorator()', function() {
        it('should get parameters decorators of specified property', function() {
            const decorators = get_method_parameter_decorator(A, 'm')
            expect(decorators).to.have.length(4)
            expect(decorators[0]).to.be.null
            expect(decorators[1]).to.be.null
            expect(decorators[3]).to.have.length(2)
            expect(decorators[3][0]).to.be.instanceof(TestDecorator)
        })

        it('should return empty array if no parameter decorator exist', function() {
            const decorators = get_method_parameter_decorator(P, 'm')
            expect(decorators).to.eql([])
        })

        it('should throw errors if not given class', function() {
            expect(() => get_method_parameter_decorator({}, 'm')).to.throw('[object Object] is not constructor.')
        })
    })

    describe('get_param_types()', function() {
        it('should get types of constructor parameters', function() {
            expect(get_param_types(A)).to.eql([Number, String, P])
        })

        it('should get types of method parameters', function() {
            expect(get_param_types(A, 'm')).to.eql([String, String, Number, Boolean])
        })
    })

    describe('get_prop_types()', function() {
        it('should get types of property', function() {
            expect(get_prop_types(A, 'm')).to.equal(Function)
            expect(get_prop_types(A, 'd')).to.eql(P)
        })
    })
})
