/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { describe, expect, it } from 'vitest'
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

describe('decorator.ts', () => {

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
        @TestDecorator('a', 123)
        d?: P = undefined

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
    }

    describe('#make_decorator()', () => {

        it('should create decorator', () => {
            const D = make_decorator('D', (a: string, b: number) => ({ a, b }))
            expect(() => new D('asd', 1)).not.toThrow()
            const ins: InstanceType<typeof D> = new D('asd', 1)
            expect(ins).toBeInstanceOf(D)
        })

        it('should create decorator with name', () => {
            const D = make_decorator('D', (a: string, b: number) => ({ a, b }))
            expect(D.name).toEqual('D')
        })

        it('should create inherited decorator', () => {
            expect(new TestDecorator('asd', 1)).toBeInstanceOf(ParentDecorator)
        })
    })

    describe('#make_abstract_decorator()', () => {
        it('should not be called', () => {
            expect(() => (ParentDecorator as any)()).toThrow('Abstract decorator can\'t be called directly')
        })
    })

    describe('#get_class_decorator()', () => {
        it('should get decorators of class', () => {
            const decorators = get_class_decorator(A)
            expect(decorators).toHaveLength(2)
            expect(decorators[0]).toBeInstanceOf(TestDecorator)
        })

        it('should return empty array if no decorator exist', () => {
            const decorators = get_class_decorator(P)
            expect(decorators).toEqual([])
        })

        it('should throw errors if not given class', () => {
            expect(() => get_class_decorator({} as any)).toThrow('[object Object] is not constructor.')
        })
    })

    describe('#get_class_parameter_decorator()', () => {
        it('should get constructor parameter decorators of class', () => {
            const decorators = get_class_parameter_decorator(A)
            expect(decorators).toHaveLength(2)
            expect(decorators[0]).toHaveLength(2)
            expect(decorators[1]).toHaveLength(1)
            expect(decorators[0][0]).toBeInstanceOf(TestDecorator)
        })

        it('should return empty array if no parameter decorator exist', () => {
            const decorators = get_class_parameter_decorator(P)
            expect(decorators).toEqual([])
        })

        it('should throw errors if not given class', () => {
            expect(() => get_class_parameter_decorator({} as any)).toThrow('[object Object] is not constructor.')
        })
    })

    describe('#get_all_prop_decorator()', () => {
        it('should get all decorators of class property', () => {
            const decorators = get_all_prop_decorator(A)
            expect(decorators?.size).toEqual(2)
            expect(decorators?.get('m')).toHaveLength(2)
            expect(decorators?.get('m')?.[0]).toBeInstanceOf(TestDecorator)
        })

        it('should throw errors if not given class', () => {
            expect(() => get_all_prop_decorator({} as any)).toThrow('[object Object] is not constructor.')
        })
    })

    describe('#get_prop_decorator()', () => {
        it('should get decorators of specified property', () => {
            const decorators = get_prop_decorator(A, 'm')
            expect(decorators).toHaveLength(2)
            expect(decorators[0]).toBeInstanceOf(TestDecorator)
        })

        it('should return empty array if no property decorator exist', () => {
            const decorators = get_prop_decorator(P, 'm')
            expect(decorators).toEqual([])
        })

        it('should throw errors if not given class', () => {
            expect(() => get_prop_decorator({} as any, 'm')).toThrow('[object Object] is not constructor.')
        })

        describe('edge cases', () => {
            it('should return empty array if no Property_Decorator descriptor at all', () => {
                class NoPropDeco {}
                const decorators = get_prop_decorator(NoPropDeco, 'm')
                expect(decorators).toEqual([])
            })

            it('should return empty array if Property_Decorator value is null', () => {
                class NullPropDeco {}
                Object.defineProperty(NullPropDeco, Symbol.for('œœ.decorator.property'), { value: null })
                const decorators = get_prop_decorator(NullPropDeco, 'm')
                expect(decorators).toEqual([])
            })

            it('should return empty array if map.get(prop) returns null', () => {
                class NullMapValueDeco {}
                const map = new Map()
                map.set('m', null)
                Object.defineProperty(NullMapValueDeco, Symbol.for('œœ.decorator.property'), { value: map })
                const decorators = get_prop_decorator(NullMapValueDeco, 'm')
                expect(decorators).toEqual([])
            })
        })
    })

    describe('#get_method_parameter_decorator()', () => {
        it('should get parameters decorators of specified property', () => {
            const decorators = get_method_parameter_decorator(A, 'm')
            expect(decorators).toHaveLength(4)
            expect(decorators[0]).toBeNull()
            expect(decorators[1]).toBeNull()
            expect(decorators[3]).toHaveLength(2)
            expect(decorators[3][0]).toBeInstanceOf(TestDecorator)
        })

        it('should return empty array if no parameter decorator exist', () => {
            const decorators = get_method_parameter_decorator(P, 'm')
            expect(decorators).toEqual([])
        })

        it('should throw errors if not given class', () => {
            expect(() => get_method_parameter_decorator({} as any, 'm')).toThrow('[object Object] is not constructor.')
        })

        describe('edge cases', () => {
            it('should return empty array if no Method_Parameter_Decorator descriptor at all', () => {
                class NoMethodParamDeco {}
                const decorators = get_method_parameter_decorator(NoMethodParamDeco, 'm')
                expect(decorators).toEqual([])
            })

            it('should return empty array if Method_Parameter_Decorator value is null', () => {
                class NullMethodParamDeco {}
                Object.defineProperty(NullMethodParamDeco, Symbol.for('œœ.decorator.method_parameter'), { value: null })
                const decorators = get_method_parameter_decorator(NullMethodParamDeco, 'm')
                expect(decorators).toEqual([])
            })

            it('should return empty array if value[prop] returns null', () => {
                class NullPropValueDeco {}
                const value: any = { m: null }
                Object.defineProperty(NullPropValueDeco, Symbol.for('œœ.decorator.method_parameter'), { value })
                const decorators = get_method_parameter_decorator(NullPropValueDeco, 'm')
                expect(decorators).toEqual([])
            })
        })
    })

    describe('#get_param_types()', () => {
        it('should get types of constructor parameters', () => {
            expect(get_param_types(A)).toEqual([Number, String, P])
        })

        it('should get types of method parameters', () => {
            expect(get_param_types(A, 'm')).toEqual([String, String, Number, Boolean])
        })
    })

    describe('#get_prop_types()', () => {
        it('should get types of property', () => {
            expect(get_prop_types(A, 'm')).toEqual(Function)
            expect(get_prop_types(A, 'd')).toEqual(P)
        })
    })
})
